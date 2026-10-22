import {
  directionDraftSchema,
  JOURNEY_VERSION,
  type Locale,
  type PaidJourney,
  type RefinementPlan,
  refinementPlanSchema,
} from "@wtfiwant/shared";
import { buildAnalysisAnswers } from "../ai/analysis";
import type { AIProvider } from "../ai/provider";
import type { AssessmentRecord } from "../repositories/types";
import type { AIJobStore } from "./store";

export async function ensurePaidPlan(
  store: AIJobStore,
  record: AssessmentRecord,
  locale: Locale,
  provider: AIProvider,
) {
  if (!record.entitlements.includes("full_analysis"))
    throw new Error("Payment required");
  return store.enqueue(record.session.id, "plan", locale, {
    answers: buildAnalysisAnswers(record, locale),
    model: provider.name,
    version: JOURNEY_VERSION,
  });
}

export function refinementAnswers(
  plan: RefinementPlan,
  responses: Record<string, string | null>,
) {
  return Object.fromEntries(
    plan.questions.flatMap((question) =>
      responses[question.id]
        ? [
            [
              `refinement:${question.id}`,
              { question: question.question, answer: responses[question.id] },
            ],
          ]
        : [],
    ),
  );
}

export async function paidJourneyView(
  store: AIJobStore,
  sessionId: string,
): Promise<PaidJourney | null> {
  const [plan, report, synthesis] = await Promise.all([
    store.get(sessionId, "plan"),
    store.get(sessionId, "report"),
    store.get(sessionId, "synthesis"),
  ]);
  if (!plan && !report) return null;
  const parsed = refinementPlanSchema.safeParse(plan?.result);
  const questions = parsed.success ? parsed.data.questions : [];
  return {
    locale: report?.locale ?? plan?.locale ?? "en",
    stage: report
      ? report.status === "ready"
        ? "ready"
        : report.status === "failed"
          ? "failed"
          : "generating"
      : synthesis
        ? synthesis.status === "ready"
          ? "reviewing"
          : synthesis.status === "failed"
            ? "failed"
            : "synthesizing"
        : plan?.status === "ready"
          ? "refining"
          : plan?.status === "failed"
            ? "failed"
            : "planning",
    draft: directionDraftSchema.safeParse(synthesis?.result).success
      ? directionDraftSchema.parse(synthesis?.result)
      : null,
    review: synthesis?.review ?? null,
    questions,
    responses: plan?.responses ?? {},
    canSkip: !report && !synthesis,
    delivery: report?.deliveryState ?? "pending",
  };
}
