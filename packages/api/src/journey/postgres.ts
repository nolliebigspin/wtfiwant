import { type DirectionReview, storedAnalysisSchema } from "@wtfiwant/shared";
import postgres, { type Sql } from "postgres";
import {
  type AIJob,
  type AIJobStore,
  frozenJobInput,
  type JobInput,
} from "./store";

type Row = {
  id: string;
  session_id: string;
  kind: AIJob["kind"];
  locale: AIJob["locale"];
  input: JobInput;
  status: AIJob["status"];
  result: unknown;
  attempts: number;
  lease_token: string | null;
  lease_until: Date | null;
  next_attempt_at: Date;
  responses: AIJob["responses"];
  direction_review: DirectionReview | null;
  delivery_state: AIJob["deliveryState"];
  delivery_attempts: number;
  delivery_after: Date;
};
const map = (row: Row): AIJob => ({
  id: row.id,
  sessionId: row.session_id,
  kind: row.kind,
  locale: row.locale,
  input: row.input,
  status: row.status,
  result: row.result,
  attempts: row.attempts,
  leaseToken: row.lease_token,
  leaseUntil: row.lease_until?.getTime() ?? 0,
  nextAttemptAt: row.next_attempt_at.getTime(),
  responses: row.responses,
  review: row.direction_review,
  deliveryState: row.delivery_state,
  deliveryAttempts: row.delivery_attempts,
  deliveryAfter: row.delivery_after.getTime(),
});

export class PostgresAIJobStore implements AIJobStore {
  constructor(private sql: Sql) {}
  static connect(databaseUrl: string) {
    return new PostgresAIJobStore(postgres(databaseUrl, { max: 2 }));
  }
  async enqueue(
    sessionId: string,
    kind: AIJob["kind"],
    locale: AIJob["locale"],
    input: JobInput,
  ) {
    return this.sql.begin(async (tx) => {
      // Same lock used by answer(): the last refinement answer cannot race the
      // immutable report snapshot. Database uniqueness also handles webhooks.
      await tx`SELECT id FROM assessment_sessions WHERE id = ${sessionId} FOR UPDATE`;
      const rows = await tx<
        Row[]
      >`SELECT * FROM paid_ai_jobs WHERE session_id = ${sessionId}`;
      const plan = rows.find((row) => row.kind === "plan");
      const synthesis = rows.find((row) => row.kind === "synthesis");
      const frozen = frozenJobInput(
        plan ? map(plan) : null,
        synthesis ? map(synthesis) : null,
        kind,
        input,
      );
      const [row] = await tx<Row[]>`
        INSERT INTO paid_ai_jobs (session_id, kind, locale, input)
        VALUES (${sessionId}, ${kind}, ${locale}, ${tx.json(frozen as never)})
        ON CONFLICT (session_id, kind) DO UPDATE SET session_id = EXCLUDED.session_id RETURNING *`;
      return map(row);
    });
  }
  async get(id: string, kind: AIJob["kind"]) {
    const [row] = await this.sql<
      Row[]
    >`SELECT * FROM paid_ai_jobs WHERE session_id = ${id} AND kind = ${kind}`;
    return row ? map(row) : null;
  }
  async answer(id: string, questionId: string, response: string | null) {
    return this.sql.begin(async (tx) => {
      await tx`SELECT id FROM assessment_sessions WHERE id = ${id} FOR UPDATE`;
      const rows =
        await tx`UPDATE paid_ai_jobs SET responses = responses || ${tx.json({ [questionId]: response })}, next_attempt_at = now() + interval '30 minutes' WHERE session_id = ${id} AND kind = 'plan' AND status = 'ready'
        AND NOT EXISTS (SELECT 1 FROM paid_ai_jobs WHERE session_id = ${id} AND kind IN ('synthesis', 'report')) RETURNING id`;
      return rows.length > 0;
    });
  }
  async saveReview(id: string, review: DirectionReview) {
    return this.sql.begin(async (tx) => {
      await tx`SELECT id FROM assessment_sessions WHERE id = ${id} FOR UPDATE`;
      const rows =
        await tx`UPDATE paid_ai_jobs SET direction_review = ${tx.json(review)}, next_attempt_at = now() + interval '30 minutes'
        WHERE session_id = ${id} AND kind = 'synthesis' AND status = 'ready' AND direction_review IS NULL
        AND NOT EXISTS (SELECT 1 FROM paid_ai_jobs WHERE session_id = ${id} AND kind = 'report') RETURNING id`;
      return rows.length > 0;
    });
  }
  async claim() {
    await this
      .sql`UPDATE paid_ai_jobs SET status = 'failed', lease_token = NULL WHERE status = 'running' AND lease_until < now() AND attempts >= 3`;
    const [row] = await this.sql<Row[]>`
      UPDATE paid_ai_jobs SET status = 'running', attempts = attempts + 1, lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes'
      WHERE id = (SELECT id FROM paid_ai_jobs AS candidate WHERE NOT EXISTS (
        SELECT 1 FROM report_purchases AS purchase LEFT JOIN purchase_legal_records AS receipt ON receipt.purchase_id = purchase.id
        WHERE purchase.session_id = candidate.session_id AND purchase.agreement->>'confirmationBeforeAI' = 'true'
        AND receipt.confirmation_sent_at IS NULL
      ) AND NOT (kind <> 'report' AND EXISTS (SELECT 1 FROM paid_ai_jobs AS downstream WHERE downstream.session_id = candidate.session_id AND (downstream.kind = 'report' OR (candidate.kind = 'plan' AND downstream.kind = 'synthesis')))) AND attempts < 3 AND next_attempt_at <= now() AND
        (status = 'queued' OR (status = 'running' AND lease_until < now())) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
    return row ? map(row) : null;
  }
  async complete(job: AIJob, result: unknown) {
    return this.sql.begin(async (tx) => {
      const [session] =
        await tx`SELECT status FROM assessment_sessions WHERE id = ${job.sessionId} FOR UPDATE`;
      if (!session || session.status === "safety_paused") return false;
      const rows =
        await tx`UPDATE paid_ai_jobs SET result = ${tx.json(result as never)}, status = 'ready', lease_token = NULL, next_attempt_at = now() + interval '30 minutes'
        WHERE id = ${job.id} AND status = 'running' AND lease_token = ${job.leaseToken} AND lease_until > now() RETURNING id`;
      if (!rows.length) return false;
      if (job.kind === "report") {
        const analysis = storedAnalysisSchema.parse(result);
        await tx`INSERT INTO assessment_analyses (session_id, version, model, locale, result, created_at)
          VALUES (${job.sessionId}, ${analysis.version}, ${analysis.model}, ${analysis.locale}, ${tx.json(analysis.result)}, ${analysis.createdAt})
          ON CONFLICT (session_id) DO UPDATE SET version = EXCLUDED.version, model = EXCLUDED.model, locale = EXCLUDED.locale, result = EXCLUDED.result, created_at = EXCLUDED.created_at`;
        await tx`UPDATE assessment_sessions SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = ${job.sessionId} AND status <> 'safety_paused'`;
      }
      return true;
    });
  }
  async fail(job: AIJob) {
    await this
      .sql`UPDATE paid_ai_jobs SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'queued' END, lease_token = NULL,
      next_attempt_at = now() + (${30 * 2 ** job.attempts} * interval '1 second') WHERE id = ${job.id} AND lease_token = ${job.leaseToken}`;
  }
  async delete(sessionId: string) {
    await this.sql`DELETE FROM paid_ai_jobs WHERE session_id = ${sessionId}`;
  }
  async abandonedPlans() {
    return (
      await this.sql<
        Row[]
      >`SELECT * FROM paid_ai_jobs AS plan WHERE EXISTS (SELECT 1 FROM report_purchases p JOIN assessment_sessions s ON s.id = p.session_id WHERE p.session_id = plan.session_id AND p.status = 'paid' AND s.status <> 'safety_paused') AND kind IN ('plan', 'synthesis') AND (status = 'failed' OR (kind = 'synthesis' AND direction_review IS NOT NULL) OR (status = 'ready' AND next_attempt_at <= now()))
      AND NOT EXISTS (SELECT 1 FROM paid_ai_jobs AS downstream WHERE downstream.session_id = plan.session_id AND (downstream.kind = 'report' OR (plan.kind = 'plan' AND downstream.kind = 'synthesis'))) ORDER BY created_at LIMIT 5`
    ).map(map);
  }
  async pendingDeliveries() {
    return (
      await this.sql<
        Row[]
      >`SELECT * FROM paid_ai_jobs AS report WHERE EXISTS (SELECT 1 FROM report_purchases p JOIN assessment_sessions s ON s.id = p.session_id WHERE p.session_id = report.session_id AND p.status = 'paid' AND s.status <> 'safety_paused') AND kind = 'report' AND status = 'ready' AND delivery_state <> 'sent' AND delivery_attempts < 5 AND delivery_after <= now() ORDER BY delivery_after LIMIT 5`
    ).map(map);
  }
  async delivered(job: AIJob, state: "sent" | "failed") {
    await this
      .sql`UPDATE paid_ai_jobs SET delivery_state = ${state}, delivery_attempts = delivery_attempts + 1, delivery_after = now() + (${60 * 2 ** (job.deliveryAttempts + 1)} * interval '1 second') WHERE id = ${job.id}`;
  }
}
