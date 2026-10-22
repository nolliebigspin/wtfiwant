import {
  compassAnalysisSchema,
  directionDraftSchema,
  type Locale,
  refinementPlanSchema,
  storedAnalysisSchema,
} from "@wtfiwant/shared";
import { boundedGuidance } from "../ai/evidence";
import { type AIProvider, analyzeAnswers } from "../ai/provider";
import { buildReportEvidence } from "../commerce/fulfillment";
import type { EmailDeliveryProvider } from "../email/provider";
import { ANALYSIS_PROMPT_VERSION } from "../prompts/analysis";
import type { AssessmentRepository } from "../repositories/types";
import { buildSafetyAnswers } from "../safety/answers";
import { classifySafety } from "../safety/classifier";
import type { AIJobStore } from "./store";

export type WorkerDependencies = {
  repository: AssessmentRepository;
  jobs: AIJobStore;
  aiProvider: AIProvider;
  emailProvider?: EmailDeliveryProvider;
  publicAppUrl: string;
};

/** Local/test mode only. Production purchases require the OpenAI provider. */
function localPlan(answers: Record<string, unknown>, locale: Locale) {
  const de = locale === "de";
  return {
    questions: [
      {
        id: "q1",
        question: de
          ? "Welche konkrete Veränderung erhoffst du dir von deinem aktuellen Ziel im Alltag?"
          : "What concrete change in your everyday life do you hope your current goal would bring?",
        evidenceQuestionIds: ["noise.working_toward"],
      },
      {
        id: "q2",
        question: de
          ? "Welchen Nachteil würdest du für deine bevorzugte Richtung tatsächlich akzeptieren?"
          : "Which downside would you actually accept for the direction you prefer?",
        evidenceQuestionIds: ["tradeoffs.choices"],
      },
      {
        id: "q3",
        question: de
          ? "Wie sähe eine gute gewöhnliche Woche für dich aus, auch außerhalb der Arbeit?"
          : "What would a good ordinary week look like for you, including life outside work?",
        evidenceQuestionIds: ["alive.memories"],
      },
      {
        id: "q4",
        question: de
          ? "Welche eine Veränderung wäre dir in den nächsten 90 Tagen am wichtigsten?"
          : "Which one change would matter most over the next 90 days?",
        evidenceQuestionIds: ["noise.working_toward"],
      },
      {
        id: "q5",
        question: de
          ? "Was begrenzt deinen nächsten Schritt gerade am stärksten?"
          : "What most limits your next step right now?",
        evidenceQuestionIds: ["life.energy"],
      },
    ].filter((question) =>
      question.evidenceQuestionIds.every((id) => id in answers),
    ),
  };
}

/** No HTTP request performs AI work. Leases fence stale workers; jobs bound cost. */
export async function processAIJob({
  repository,
  jobs,
  aiProvider,
}: WorkerDependencies) {
  for (const plan of await jobs.abandonedPlans()) {
    const record = await repository.getSession(plan.sessionId);
    if (
      record?.entitlements.includes("full_analysis") &&
      record.session.status !== "safety_paused"
    )
      await jobs.enqueue(
        plan.sessionId,
        plan.kind === "plan" && plan.input.version.startsWith("v4-")
          ? "synthesis"
          : "report",
        plan.locale,
        plan.input,
      );
  }
  const job = await jobs.claim();
  if (!job) return false;
  try {
    const record = await repository.getSession(job.sessionId);
    if (
      !record ||
      !record.entitlements.includes("full_analysis") ||
      record.session.status === "safety_paused"
    )
      throw new Error("Job no longer entitled");
    if (
      classifySafety({
        ...buildSafetyAnswers(record),
        ...job.input.answers,
      }) === "immediate_self_harm_risk"
    ) {
      await repository.setStatus(job.sessionId, "safety_paused");
      throw new Error("Reflection paused");
    }
    // Refuse to silently run an already queued request with a different model.
    if (job.input.model !== aiProvider.name)
      throw new Error("Model configuration changed");
    if (job.kind === "plan") {
      const plan = await boundedGuidance(
        (repair) =>
          aiProvider.generateRefinementPlan
            ? aiProvider.generateRefinementPlan(
                job.input.answers,
                job.sessionId,
                job.locale,
                repair,
              )
            : Promise.resolve(localPlan(job.input.answers, job.locale)),
        (value) => refinementPlanSchema.parse(value),
        job.input.answers,
      );
      await jobs.complete(job, plan);
    } else if (job.kind === "synthesis") {
      const generateDirection = aiProvider.generateDirection?.bind(aiProvider);
      if (!generateDirection)
        throw new Error("Direction generation unavailable");
      const draft = await boundedGuidance(
        (repair) =>
          generateDirection(
            job.input.answers,
            job.sessionId,
            job.locale,
            repair,
          ),
        (value) => directionDraftSchema.parse(value),
        job.input.answers,
      );
      await jobs.complete(job, draft);
    } else {
      const result = await analyzeAnswers(
        aiProvider,
        job.input.answers,
        job.sessionId,
        job.locale,
        job.input.direction,
        job.input.version.startsWith("v4-"),
      );
      if (job.input.version.startsWith("v4-"))
        compassAnalysisSchema.parse(result);
      if (result.compass) {
        const chosen =
          job.input.direction?.review ?? job.input.direction?.draft;
        if (chosen) {
          result.compass.northStar = chosen.northStar;
          result.compass.priority = chosen.priority;
        }
        if (
          job.input.direction?.review &&
          "direction:review" in job.input.answers &&
          !result.compass.evidenceQuestionIds.includes("direction:review")
        )
          result.compass.evidenceQuestionIds = [
            ...result.compass.evidenceQuestionIds.slice(0, 7),
            "direction:review",
          ];
        result.directionStatus =
          job.input.direction?.review?.alignment ?? "not_reviewed";
      }
      const analysis = storedAnalysisSchema.parse({
        version: ANALYSIS_PROMPT_VERSION,
        model: aiProvider.name,
        locale: job.locale,
        result,
        createdAt: new Date().toISOString(),
      });
      // A safety pause/deletion during the request must not publish its result.
      const latest = await repository.getSession(job.sessionId);
      if (
        latest?.session.status === "safety_paused" ||
        !latest?.entitlements.includes("full_analysis") ||
        classifySafety(buildSafetyAnswers(latest)) ===
          "immediate_self_harm_risk"
      )
        throw new Error("Job no longer entitled");
      await jobs.complete(job, analysis);
    }
  } catch (error) {
    console.error("Paid AI job attempt failed", {
      kind: job.kind,
      attempt: job.attempts,
      name: error instanceof Error ? error.name : "JobError",
    });
    // Never persist provider errors, which can contain answers or credentials.
    await jobs.fail(job);
  }
  return true;
}

export async function deliverReadyReports({
  repository,
  jobs,
  emailProvider,
  publicAppUrl,
}: WorkerDependencies) {
  if (!emailProvider) return;
  for (const job of await jobs.pendingDeliveries()) {
    const record = await repository.getSession(job.sessionId);
    const purchase = await repository.getPurchaseForSession(job.sessionId);
    if (
      !record?.analysis ||
      record.session.status === "safety_paused" ||
      !record.entitlements.includes("full_analysis") ||
      !purchase?.recipientEmail
    )
      continue;
    if (
      classifySafety(buildSafetyAnswers(record)) === "immediate_self_harm_risk"
    ) {
      await repository.setStatus(job.sessionId, "safety_paused");
      continue;
    }
    const deliveryId = await repository.claimInitialDelivery(purchase.id);
    if (!deliveryId) {
      const delivery = await repository.getDeliveryStatus(purchase.id);
      if (delivery?.status === "sent") await jobs.delivered(job, "sent");
      else if (delivery && delivery.attempts >= 5)
        await jobs.delivered(job, "failed");
      continue;
    }
    try {
      const sent = await emailProvider.sendFullCompass({
        to: purchase.recipientEmail,
        locale: record.analysis.locale,
        analysis: record.analysis,
        evidence: buildReportEvidence(record, job.input.answers),
        actionPlan: record.actionPlan,
        resultUrl: `${publicAppUrl}/${record.analysis.locale}/result/${record.session.id}`,
        idempotencyKey: `full-compass/${purchase.id}`,
        purchase,
      });
      await repository.markDeliverySent(deliveryId, sent.messageId);
      await jobs.delivered(job, "sent");
    } catch {
      await repository.markDeliveryFailed(deliveryId, "ReportDeliveryError");
      await jobs.delivered(job, "failed");
    }
  }
}
