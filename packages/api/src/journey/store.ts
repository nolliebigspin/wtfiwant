import {
  type DirectionDraft,
  type DirectionReview,
  type Locale,
  storedAnalysisSchema,
} from "@wtfiwant/shared";
import type { AssessmentRepository } from "../repositories/types";

export type JobInput = {
  answers: Record<string, unknown>;
  model: string;
  version: string;
  direction?: { draft: DirectionDraft; review: DirectionReview | null };
};
export type AIJob = {
  id: string;
  sessionId: string;
  kind: "plan" | "synthesis" | "report";
  locale: Locale;
  input: JobInput;
  status: "queued" | "running" | "ready" | "failed";
  result: unknown;
  attempts: number;
  leaseToken: string | null;
  leaseUntil: number;
  nextAttemptAt: number;
  responses: Record<string, string | null>;
  review: DirectionReview | null;
  deliveryState: "pending" | "sent" | "failed";
  deliveryAttempts: number;
  deliveryAfter: number;
};
export interface AIJobStore {
  enqueue(
    sessionId: string,
    kind: AIJob["kind"],
    locale: Locale,
    input: JobInput,
  ): Promise<AIJob>;
  get(sessionId: string, kind: AIJob["kind"]): Promise<AIJob | null>;
  answer(
    sessionId: string,
    questionId: string,
    response: string | null,
  ): Promise<boolean>;
  saveReview(sessionId: string, review: DirectionReview): Promise<boolean>;
  claim(): Promise<AIJob | null>;
  complete(job: AIJob, result: unknown): Promise<boolean>;
  fail(job: AIJob): Promise<void>;
  abandonedPlans(): Promise<AIJob[]>;
  pendingDeliveries(): Promise<AIJob[]>;
  delivered(job: AIJob, state: "sent" | "failed"): Promise<void>;
  delete(sessionId: string): Promise<void>;
}

/** Test/dev adapter shares the same leases, retry budget and immutable inputs. */
export class InMemoryAIJobStore implements AIJobStore {
  private jobs = new Map<string, AIJob>();
  constructor(
    private repository: AssessmentRepository,
    private now: () => number = Date.now,
  ) {}
  private key(id: string, kind: string) {
    return `${id}/${kind}`;
  }
  async enqueue(
    sessionId: string,
    kind: AIJob["kind"],
    locale: Locale,
    input: JobInput,
  ) {
    const key = this.key(sessionId, kind);
    const existing = this.jobs.get(key);
    if (existing) return structuredClone(existing);
    input = frozenJobInput(
      this.jobs.get(this.key(sessionId, "plan")) ?? null,
      this.jobs.get(this.key(sessionId, "synthesis")) ?? null,
      kind,
      input,
    );
    const job: AIJob = {
      id: crypto.randomUUID(),
      sessionId,
      kind,
      locale,
      input: structuredClone(input),
      status: "queued",
      result: null,
      attempts: 0,
      leaseToken: null,
      leaseUntil: 0,
      nextAttemptAt: this.now(),
      responses: {},
      review: null,
      deliveryState: "pending",
      deliveryAttempts: 0,
      deliveryAfter: 0,
    };
    this.jobs.set(key, job);
    return structuredClone(job);
  }
  async get(id: string, kind: AIJob["kind"]) {
    return structuredClone(this.jobs.get(this.key(id, kind)) ?? null);
  }
  async answer(id: string, questionId: string, response: string | null) {
    const plan = this.jobs.get(this.key(id, "plan"));
    if (
      !plan ||
      plan.status !== "ready" ||
      this.jobs.has(this.key(id, "report")) ||
      this.jobs.has(this.key(id, "synthesis"))
    )
      return false;
    plan.responses[questionId] = response;
    plan.nextAttemptAt = this.now() + 30 * 60_000;
    return true;
  }
  async saveReview(id: string, review: DirectionReview) {
    const job = this.jobs.get(this.key(id, "synthesis"));
    if (
      !job ||
      job.status !== "ready" ||
      job.review ||
      this.jobs.has(this.key(id, "report"))
    )
      return false;
    job.review = structuredClone(review);
    job.nextAttemptAt = this.now() + 30 * 60_000;
    return true;
  }
  async claim() {
    for (const job of this.jobs.values()) {
      if (
        (job.kind === "plan" &&
          this.jobs.has(this.key(job.sessionId, "synthesis"))) ||
        (job.kind !== "report" &&
          this.jobs.has(this.key(job.sessionId, "report")))
      )
        continue;
      if (
        (job.status !== "queued" && job.status !== "running") ||
        job.nextAttemptAt > this.now() ||
        (job.status === "running" && job.leaseUntil > this.now())
      )
        continue;
      if (job.attempts >= 3) {
        job.status = "failed";
        continue;
      }
      job.status = "running";
      job.attempts++;
      job.leaseToken = crypto.randomUUID();
      job.leaseUntil = this.now() + 300_000;
      return structuredClone(job);
    }
    return null;
  }
  async complete(job: AIJob, result: unknown) {
    const stored = this.jobs.get(this.key(job.sessionId, job.kind));
    const record = await this.repository.getSession(job.sessionId);
    if (
      !record ||
      record.session.status === "safety_paused" ||
      !stored ||
      stored.status !== "running" ||
      stored.leaseToken !== job.leaseToken ||
      stored.leaseUntil < this.now()
    )
      return false;
    if (
      job.kind === "report" &&
      !(await this.repository.saveAnalysis(
        job.sessionId,
        storedAnalysisSchema.parse(result),
      ))
    )
      return false;
    stored.result = structuredClone(result);
    stored.status = "ready";
    if (job.kind !== "report") stored.nextAttemptAt = this.now() + 30 * 60_000;
    stored.leaseToken = null;
    return true;
  }
  async fail(job: AIJob) {
    const stored = this.jobs.get(this.key(job.sessionId, job.kind));
    if (!stored || stored.leaseToken !== job.leaseToken) return;
    stored.status = stored.attempts >= 3 ? "failed" : "queued";
    stored.nextAttemptAt = this.now() + 30_000 * 2 ** stored.attempts;
    stored.leaseToken = null;
  }
  async delete(sessionId: string) {
    for (const [key, job] of this.jobs)
      if (job.sessionId === sessionId) this.jobs.delete(key);
  }
  async abandonedPlans() {
    return structuredClone(
      [...this.jobs.values()]
        .filter(
          (job) =>
            job.kind !== "report" &&
            !(
              job.kind === "plan" &&
              this.jobs.has(this.key(job.sessionId, "synthesis"))
            ) &&
            !this.jobs.has(this.key(job.sessionId, "report")) &&
            (job.status === "failed" ||
              (job.kind === "synthesis" && job.review !== null) ||
              (job.status === "ready" && job.nextAttemptAt <= this.now())),
        )
        .slice(0, 5),
    );
  }
  async pendingDeliveries() {
    return structuredClone(
      [...this.jobs.values()]
        .filter(
          (job) =>
            job.kind === "report" &&
            job.status === "ready" &&
            job.deliveryState !== "sent" &&
            job.deliveryAttempts < 5 &&
            job.deliveryAfter <= this.now(),
        )
        .slice(0, 5),
    );
  }
  async delivered(job: AIJob, state: "sent" | "failed") {
    const stored = this.jobs.get(this.key(job.sessionId, "report"));
    if (!stored) return;
    stored.deliveryState = state;
    stored.deliveryAttempts++;
    stored.deliveryAfter = this.now() + 60_000 * 2 ** stored.deliveryAttempts;
  }
}

/** Called under the session lock in PostgreSQL. Every downstream stage freezes its predecessor. */
export function frozenJobInput(
  plan: AIJob | null,
  synthesis: AIJob | null,
  kind: AIJob["kind"],
  input: JobInput,
): JobInput {
  if (kind === "plan" || !plan) return input;
  if (kind === "report" && synthesis) {
    const draft = synthesis.result as DirectionDraft | null;
    const review = synthesis.review;
    return {
      ...synthesis.input,
      ...(draft ? { direction: { draft, review } } : {}),
      answers: {
        ...synthesis.input.answers,
        ...(review
          ? {
              "direction:review": {
                question:
                  synthesis.locale === "de"
                    ? "Deine gewählte Richtung und Rückmeldung"
                    : "Your chosen direction and feedback",
                answer: [review.northStar, review.priority, review.feedback]
                  .filter(Boolean)
                  .join("\n"),
              },
            }
          : {}),
      },
    };
  }
  const questions =
    (plan.result as { questions?: { id: string; question: string }[] } | null)
      ?.questions ?? [];
  return {
    ...plan.input,
    answers: {
      ...plan.input.answers,
      ...Object.fromEntries(
        questions.flatMap((q) =>
          plan.responses[q.id]
            ? [
                [
                  `refinement:${q.id}`,
                  { question: q.question, answer: plan.responses[q.id] },
                ],
              ]
            : [],
        ),
      ),
    },
  };
}
