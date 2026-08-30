import {
  type ActionPlanInput,
  assessmentQuestions,
  type ChapterId,
  coachPromptSchema,
  type Session,
  type StoredAnalysis,
} from "@wtfiwant/shared";
import postgres, { type Sql } from "postgres";
import type {
  AssessmentRecord,
  AssessmentRepository,
  NewCoachPrompt,
  NewFollowUp,
  ReportPurchase,
} from "./types";

type PurchaseRow = {
  id: string;
  session_id: string;
  status: ReportPurchase["status"];
  stripe_checkout_session_id: string;
  checkout_url: string;
  stripe_payment_intent_id: string | null;
  recipient_email: string | null;
  currency: string | null;
  amount_total: number | null;
  paid_at: Date | null;
};

function mapPurchase(row: PurchaseRow): ReportPurchase {
  return {
    id: row.id,
    sessionId: row.session_id,
    status: row.status,
    checkoutSessionId: row.stripe_checkout_session_id,
    checkoutUrl: row.checkout_url,
    paymentIntentId: row.stripe_payment_intent_id,
    recipientEmail: row.recipient_email,
    currency: row.currency,
    amountTotal: row.amount_total,
    paidAt: row.paid_at?.toISOString() ?? null,
  };
}

type SessionRow = {
  id: string;
  status: Session["status"];
  current_chapter: ChapterId;
  current_question_id: string;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
};

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    status: row.status,
    currentChapter: row.current_chapter,
    currentQuestionId: row.current_question_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    completedAt: row.completed_at?.toISOString() ?? null,
  };
}

export class PostgresAssessmentRepository implements AssessmentRepository {
  constructor(private readonly sql: Sql) {}

  static connect(databaseUrl: string): PostgresAssessmentRepository {
    return new PostgresAssessmentRepository(postgres(databaseUrl));
  }

  async createSession(): Promise<AssessmentRecord> {
    const first = assessmentQuestions[0];
    const [row] = await this.sql<SessionRow[]>`
      INSERT INTO assessment_sessions (status, current_chapter, current_question_id)
      VALUES ('in_progress', ${first.chapter}, ${first.id})
      RETURNING *
    `;
    return {
      session: mapSession(row),
      answers: {},
      followUps: [],
      coachPrompts: [],
      analysis: null,
      actionPlan: null,
      entitlements: ["assessment"],
    };
  }

  async getSession(id: string): Promise<AssessmentRecord | null> {
    const sessionRows = await this.sql<SessionRow[]>`
      SELECT * FROM assessment_sessions WHERE id = ${id}
    `;
    const row = sessionRows[0];
    if (!row) return null;

    const [
      answerRows,
      followUpRows,
      coachPromptRows,
      analysisRows,
      actionRows,
      purchaseRows,
    ] = await Promise.all([
      this.sql<
        Array<{
          question_id: string;
          answer: AssessmentRecord["answers"][string];
        }>
      >`
        SELECT question_id, answer FROM assessment_answers WHERE session_id = ${id}
      `,
      this.sql<
        Array<{
          id: string;
          question_id: string;
          generated_question: string;
          locale: StoredAnalysis["locale"];
          user_response: string | null;
          created_at: Date;
        }>
      >`
        SELECT id, question_id, generated_question, locale, user_response, created_at
        FROM ai_followups WHERE session_id = ${id} ORDER BY created_at
      `,
      this.sql<
        Array<{
          id: string;
          chapter: ChapterId;
          question: string;
          evidence_question_ids: string[];
          prompt_version: string;
          locale: StoredAnalysis["locale"];
          user_response: string | null;
          resolved_at: Date | null;
          created_at: Date;
        }>
      >`
        SELECT id, chapter, question, evidence_question_ids, prompt_version, locale, user_response, resolved_at, created_at
        FROM ai_coach_prompts WHERE session_id = ${id} ORDER BY created_at
      `,
      this.sql<
        Array<{
          version: string;
          model: string;
          locale: StoredAnalysis["locale"];
          result: StoredAnalysis["result"];
          created_at: Date;
        }>
      >`
        SELECT version, model, locale, result, created_at
        FROM assessment_analyses WHERE session_id = ${id} ORDER BY created_at DESC LIMIT 1
      `,
      this.sql<
        Array<{
          direction: string;
          experiment: string;
          immediate_action: string;
          obstacle: string;
          if_condition: string;
          then_action: string;
          updated_at: Date;
        }>
      >`
        SELECT direction, experiment, immediate_action, obstacle, if_condition, then_action, updated_at
        FROM action_plans WHERE session_id = ${id}
      `,
      this.sql<Array<{ status: ReportPurchase["status"] }>>`
        SELECT status FROM report_purchases WHERE session_id = ${id}
      `,
    ]);

    const analysisRow = analysisRows[0];
    const actionRow = actionRows[0];
    return {
      session: mapSession(row),
      answers: Object.fromEntries(
        answerRows.map((answer) => [answer.question_id, answer.answer]),
      ),
      followUps: followUpRows.map((followUp) => ({
        id: followUp.id,
        questionId: followUp.question_id,
        generatedQuestion: followUp.generated_question,
        locale: followUp.locale,
        userResponse: followUp.user_response,
        createdAt: followUp.created_at.toISOString(),
      })),
      coachPrompts: coachPromptRows.map((prompt) =>
        coachPromptSchema.parse({
          id: prompt.id,
          chapter: prompt.chapter,
          question: prompt.question,
          evidenceQuestionIds: prompt.evidence_question_ids,
          promptVersion: prompt.prompt_version,
          locale: prompt.locale,
          userResponse: prompt.user_response,
          resolvedAt: prompt.resolved_at?.toISOString() ?? null,
          createdAt: prompt.created_at.toISOString(),
        }),
      ),
      analysis: analysisRow
        ? {
            version: analysisRow.version,
            model: analysisRow.model,
            locale: analysisRow.locale,
            result: analysisRow.result,
            createdAt: analysisRow.created_at.toISOString(),
          }
        : null,
      actionPlan: actionRow
        ? {
            direction: actionRow.direction,
            experiment: actionRow.experiment,
            immediateAction: actionRow.immediate_action,
            obstacle: actionRow.obstacle,
            ifCondition: actionRow.if_condition,
            thenAction: actionRow.then_action,
            updatedAt: actionRow.updated_at.toISOString(),
          }
        : null,
      entitlements:
        purchaseRows[0]?.status === "paid" && row.status !== "safety_paused"
          ? ["assessment", "full_analysis"]
          : ["assessment"],
    };
  }

  async updateProgress(
    id: string,
    chapter: ChapterId,
    questionId: string,
  ): Promise<Session | null> {
    const rows = await this.sql<SessionRow[]>`
      UPDATE assessment_sessions
      SET current_chapter = ${chapter}, current_question_id = ${questionId}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? mapSession(rows[0]) : null;
  }

  async saveAnswer(
    id: string,
    questionId: string,
    value: unknown,
  ): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO assessment_answers (session_id, question_id, answer)
      SELECT ${id}, ${questionId}, ${this.sql.json(value as never)}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      ON CONFLICT (session_id, question_id)
      DO UPDATE SET answer = EXCLUDED.answer, updated_at = now()
      RETURNING id
    `;
    return rows.length > 0;
  }

  async saveFollowUp(id: string, followUp: NewFollowUp): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO ai_followups (
        id, session_id, question_id, user_answer, generated_question, locale, user_response, created_at
      )
      SELECT ${followUp.id}, ${id}, ${followUp.questionId}, ${followUp.userAnswer}, ${followUp.generatedQuestion},
        ${followUp.locale}, ${followUp.userResponse}, ${followUp.createdAt}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      RETURNING id
    `;
    return rows.length > 0;
  }

  async saveFollowUpResponse(
    id: string,
    followUpId: string,
    response: string,
  ): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      UPDATE ai_followups SET user_response = ${response}
      WHERE session_id = ${id} AND id = ${followUpId}
      RETURNING id
    `;
    return rows.length > 0;
  }

  async saveCoachPrompt(id: string, prompt: NewCoachPrompt): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO ai_coach_prompts (
        id, session_id, chapter, question, evidence_question_ids, prompt_version, locale, user_response, resolved_at, created_at
      ) SELECT ${prompt.id}, ${id}, ${prompt.chapter}, ${prompt.question}, ${prompt.evidenceQuestionIds},
        ${prompt.promptVersion}, ${prompt.locale}, ${prompt.userResponse}, ${prompt.resolvedAt}, ${prompt.createdAt}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      RETURNING id
    `;
    return rows.length > 0;
  }

  async resolveCoachPrompt(
    id: string,
    promptId: string,
    response: string | null,
  ): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      UPDATE ai_coach_prompts
      SET user_response = ${response}, resolved_at = now()
      WHERE session_id = ${id} AND id = ${promptId}
      RETURNING id
    `;
    return rows.length > 0;
  }

  async getPurchaseForSession(id: string): Promise<ReportPurchase | null> {
    const rows = await this.sql<PurchaseRow[]>`
      SELECT * FROM report_purchases WHERE session_id = ${id}
    `;
    return rows[0] ? mapPurchase(rows[0]) : null;
  }

  async getPurchaseByCheckout(
    checkoutSessionId: string,
  ): Promise<ReportPurchase | null> {
    const rows = await this.sql<PurchaseRow[]>`
      SELECT * FROM report_purchases
      WHERE stripe_checkout_session_id = ${checkoutSessionId}
    `;
    return rows[0] ? mapPurchase(rows[0]) : null;
  }

  async saveCheckout(
    sessionId: string,
    checkout: { id: string; url: string },
  ): Promise<ReportPurchase> {
    const rows = await this.sql<PurchaseRow[]>`
      INSERT INTO report_purchases (
        session_id, status, stripe_checkout_session_id, checkout_url
      ) VALUES (${sessionId}, 'checkout_open', ${checkout.id}, ${checkout.url})
      ON CONFLICT (session_id) DO UPDATE SET
        status = 'checkout_open',
        stripe_checkout_session_id = EXCLUDED.stripe_checkout_session_id,
        checkout_url = EXCLUDED.checkout_url,
        stripe_payment_intent_id = NULL,
        recipient_email = NULL,
        currency = NULL,
        amount_total = NULL,
        paid_at = NULL,
        updated_at = now()
      WHERE report_purchases.status <> 'paid'
      RETURNING *
    `;
    const row = rows[0];
    if (!row) {
      const existing = await this.getPurchaseForSession(sessionId);
      if (!existing) throw new Error("Could not persist Checkout");
      return existing;
    }
    return mapPurchase(row);
  }

  async markPurchasePaid(input: {
    checkoutSessionId: string;
    paymentIntentId: string | null;
    recipientEmail: string;
    currency: string | null;
    amountTotal: number | null;
  }): Promise<ReportPurchase | null> {
    return this.sql.begin(async (transaction) => {
      const locked = await transaction<PurchaseRow[]>`
        SELECT * FROM report_purchases
        WHERE stripe_checkout_session_id = ${input.checkoutSessionId}
        FOR UPDATE
      `;
      if (!locked[0]) return null;
      const rows = await transaction<PurchaseRow[]>`
        UPDATE report_purchases SET
          status = 'paid',
          stripe_payment_intent_id = ${input.paymentIntentId},
          recipient_email = ${input.recipientEmail},
          currency = ${input.currency},
          amount_total = ${input.amountTotal},
          paid_at = COALESCE(paid_at, now()),
          updated_at = now()
        WHERE stripe_checkout_session_id = ${input.checkoutSessionId}
        RETURNING *
      `;
      return rows[0] ? mapPurchase(rows[0]) : null;
    });
  }

  async setPurchaseStatusByCheckout(
    checkoutSessionId: string,
    status: "failed" | "expired",
  ): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      UPDATE report_purchases SET status = ${status}, updated_at = now()
      WHERE stripe_checkout_session_id = ${checkoutSessionId} AND status <> 'paid'
      RETURNING id
    `;
    return rows.length > 0;
  }

  async claimWebhookEvent(provider: string, eventId: string): Promise<boolean> {
    const rows = await this.sql<Array<{ event_id: string }>>`
      INSERT INTO processed_webhook_events (provider, event_id, status)
      VALUES (${provider}, ${eventId}, 'processing')
      ON CONFLICT (provider, event_id) DO UPDATE SET
        status = 'processing', updated_at = now()
      WHERE processed_webhook_events.status = 'processing'
        AND processed_webhook_events.updated_at <= now() - interval '5 minutes'
      RETURNING event_id
    `;
    return rows.length > 0;
  }

  async completeWebhookEvent(provider: string, eventId: string): Promise<void> {
    await this.sql`
      UPDATE processed_webhook_events
      SET status = 'processed', processed_at = now(), updated_at = now()
      WHERE provider = ${provider} AND event_id = ${eventId}
    `;
  }

  async releaseWebhookEvent(provider: string, eventId: string): Promise<void> {
    await this.sql`
      DELETE FROM processed_webhook_events
      WHERE provider = ${provider} AND event_id = ${eventId}
        AND status = 'processing'
    `;
  }

  async claimInitialDelivery(purchaseId: string): Promise<string | null> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO report_deliveries (purchase_id, status)
      VALUES (${purchaseId}, 'pending')
      ON CONFLICT (purchase_id, delivery_kind) DO UPDATE SET
        status = 'pending', attempt_count = report_deliveries.attempt_count + 1,
        last_error_code = NULL, updated_at = now()
      WHERE report_deliveries.attempt_count < 5 AND (
        (report_deliveries.status = 'pending'
          AND report_deliveries.updated_at <= now() - interval '5 minutes')
        OR (report_deliveries.status = 'failed'
          AND report_deliveries.updated_at <= now() - interval '60 seconds')
      )
      RETURNING id
    `;
    return rows[0]?.id ?? null;
  }

  async prepareDeliveryRetry(
    purchaseId: string,
  ): Promise<{ deliveryId: string; attemptCount: number } | null> {
    const rows = await this.sql<Array<{ id: string; attempt_count: number }>>`
      UPDATE report_deliveries
      SET status = 'pending', attempt_count = attempt_count + 1,
        last_error_code = NULL, updated_at = now()
      WHERE purchase_id = ${purchaseId} AND delivery_kind = 'full_compass'
        AND attempt_count < 5
        AND updated_at <= now() - interval '60 seconds'
      RETURNING id, attempt_count
    `;
    const row = rows[0];
    return row ? { deliveryId: row.id, attemptCount: row.attempt_count } : null;
  }

  async markDeliverySent(deliveryId: string, messageId: string): Promise<void> {
    await this.sql`
      UPDATE report_deliveries
      SET status = 'sent', provider_message_id = ${messageId}, updated_at = now()
      WHERE id = ${deliveryId}
    `;
  }

  async markDeliveryFailed(
    deliveryId: string,
    errorCode: string,
  ): Promise<void> {
    await this.sql`
      UPDATE report_deliveries
      SET status = 'failed', last_error_code = ${errorCode}, updated_at = now()
      WHERE id = ${deliveryId}
    `;
  }

  async saveAnalysis(id: string, analysis: StoredAnalysis): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO assessment_analyses (session_id, version, result, model, locale, created_at)
      VALUES (${id}, ${analysis.version}, ${this.sql.json(analysis.result)}, ${analysis.model}, ${analysis.locale}, ${analysis.createdAt})
      ON CONFLICT (session_id)
      DO UPDATE SET version = EXCLUDED.version, result = EXCLUDED.result,
        model = EXCLUDED.model, locale = EXCLUDED.locale, created_at = EXCLUDED.created_at
      RETURNING id
    `;
    if (rows.length === 0) return false;
    await this.sql`
      UPDATE assessment_sessions
      SET status = 'completed', completed_at = now(), updated_at = now()
      WHERE id = ${id}
    `;
    return true;
  }

  async setStatus(id: string, status: Session["status"]): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      UPDATE assessment_sessions SET status = ${status}, updated_at = now()
      WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }

  async saveActionPlan(id: string, input: ActionPlanInput): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO action_plans (
        session_id, direction, experiment, immediate_action, obstacle, if_condition, then_action
      ) SELECT
        ${id}, ${input.direction}, ${input.experiment}, ${input.immediateAction}, ${input.obstacle},
        ${input.ifCondition}, ${input.thenAction}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      ON CONFLICT (session_id)
      DO UPDATE SET direction = EXCLUDED.direction, experiment = EXCLUDED.experiment,
        immediate_action = EXCLUDED.immediate_action, obstacle = EXCLUDED.obstacle,
        if_condition = EXCLUDED.if_condition, then_action = EXCLUDED.then_action, updated_at = now()
      RETURNING id
    `;
    return rows.length > 0;
  }

  async deleteSession(id: string): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      DELETE FROM assessment_sessions WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }
}
