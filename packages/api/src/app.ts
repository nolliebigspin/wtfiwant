import {
  type AnalysisPreview,
  actionPlanInputSchema,
  analysisInputSchema,
  assessmentQuestions,
  checkoutInputSchema,
  checkoutSessionIdSchema,
  coachPromptInputSchema,
  coachPromptResponseInputSchema,
  coachPromptResponseSchema,
  followUpIdSchema,
  fulfillmentResponseSchema,
  generatedCoachPromptSchema,
  paymentEventSchema,
  saveAnswerInputSchema,
  seedPersonaSchema,
  sessionIdSchema,
  sessionViewSchema,
  updateSessionInputSchema,
  validateQuestionAnswer,
  webhookResponseSchema,
} from "@wtfiwant/shared";
import { type Context, Hono, type Next } from "hono";
import { LocalAIProvider } from "./ai/local";
import { type AIProvider, analyzeAnswers } from "./ai/provider";
import { buildReportEvidence, fulfillCheckout } from "./commerce/fulfillment";
import type { PaymentEvent, PaymentProvider } from "./commerce/payment";
import { createSeedSession } from "./dev/personas";
import type { EmailDeliveryProvider } from "./email/provider";
import { ANALYSIS_PROMPT_VERSION } from "./prompts/analysis";
import type {
  AssessmentRecord,
  AssessmentRepository,
} from "./repositories/types";
import { buildSafetyAnswers } from "./safety/answers";
import { classifySafety, SAFETY_MESSAGE } from "./safety/classifier";

type AppDependencies = {
  repository: AssessmentRepository;
  aiProvider?: AIProvider;
  paymentProvider?: PaymentProvider;
  emailProvider?: EmailDeliveryProvider;
  publicAppUrl?: string;
  legalLinks?: { termsUrl: string; refundPolicyUrl: string };
  /**
   * Path the app is mounted under. Next.js serves it from `/api`; tests mount
   * it at the root so request paths stay identical to the route definitions.
   */
  basePath?: string;
};

function createPreview(record: AssessmentRecord): AnalysisPreview | null {
  if (!record.analysis) return null;
  return {
    locale: record.analysis.locale,
    summary: record.analysis.result.summary,
    coreDriver: record.analysis.result.coreDrivers[0],
    lockedSections: [
      "drivers",
      "tensions",
      "anti_life",
      "influences",
      "directions",
      "goals",
      "action_plan",
    ],
  };
}

function toSessionView(
  record: AssessmentRecord,
  checkoutAvailable: boolean,
  legalLinks: AppDependencies["legalLinks"],
) {
  const full = record.entitlements.includes("full_analysis");
  return sessionViewSchema.parse({
    session: record.session,
    answers: record.answers,
    followUps: record.followUps,
    coachPrompts: record.coachPrompts,
    preview:
      record.session.status === "safety_paused" ? null : createPreview(record),
    actionPlan: full ? record.actionPlan : null,
    entitlements: record.entitlements,
    checkoutAvailable,
    legalLinks: legalLinks ?? null,
  });
}

export function createApp({
  repository,
  aiProvider = new LocalAIProvider(),
  paymentProvider,
  emailProvider,
  publicAppUrl = "http://localhost:3000",
  legalLinks,
  basePath = "/",
}: AppDependencies) {
  const app = new Hono().basePath(basePath);
  const checkoutAvailable = Boolean(
    paymentProvider && emailProvider && legalLinks,
  );

  const isSafetyPaused = async (record: AssessmentRecord) => {
    if (
      record.session.status !== "safety_paused" &&
      classifySafety(buildSafetyAnswers(record)) !== "immediate_self_harm_risk"
    )
      return false;
    if (record.session.status !== "safety_paused")
      await repository.setStatus(record.session.id, "safety_paused");
    return true;
  };

  const safetyMessage = (locale: "en" | "de") =>
    locale === "de"
      ? "Deine Antwort deutet darauf hin, dass du in unmittelbarer Gefahr sein könntest. Deshalb wurde diese Reflexion pausiert. Wenn du diese Gedanken jetzt in die Tat umsetzen könntest, rufe den örtlichen Notruf oder gehe in die nächste Notaufnahme. Kontaktiere wenn möglich eine vertraute Person und bleibe nicht allein. Diese App kann keine Krisenhilfe leisten."
      : SAFETY_MESSAGE;

  app.get("/health", (context) => context.json({ status: "ok" }));

  const validateSessionId = async (context: Context, next: Next) => {
    if (!sessionIdSchema.safeParse(context.req.param("id")).success) {
      return context.json({ error: "Invalid reflection ID" }, 400);
    }
    await next();
  };
  app.use("/sessions/:id", validateSessionId);
  app.use("/sessions/:id/*", validateSessionId);

  app.post("/sessions", async (context) => {
    const session = toSessionView(
      await repository.createSession(),
      checkoutAvailable,
      legalLinks,
    );
    return context.json(session, 201);
  });

  app.get("/sessions/:id", async (context) => {
    const session = await repository.getSession(context.req.param("id"));
    if (!session) return context.json({ error: "Reflection not found" }, 404);
    return context.json(toSessionView(session, checkoutAvailable, legalLinks));
  });

  app.patch("/sessions/:id", async (context) => {
    const input = updateSessionInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid progress update" }, 400);
    const question = assessmentQuestions.find(
      (candidate) =>
        candidate.id === input.data.currentQuestionId &&
        candidate.chapter === input.data.currentChapter,
    );
    if (!question)
      return context.json({ error: "Unknown assessment position" }, 400);
    const session = await repository.updateProgress(
      context.req.param("id"),
      input.data.currentChapter,
      input.data.currentQuestionId,
    );
    if (!session) return context.json({ error: "Reflection not found" }, 404);
    return context.json({ session });
  });

  app.put("/sessions/:id/answers/:questionId", async (context) => {
    const input = saveAnswerInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid answer payload" }, 400);
    const answer = validateQuestionAnswer(
      context.req.param("questionId"),
      input.data.value,
    );
    if (!answer.success) return context.json({ error: answer.message }, 400);
    const saved = await repository.saveAnswer(
      context.req.param("id"),
      context.req.param("questionId"),
      input.data.value,
    );
    if (!saved) return context.json({ error: "Reflection not found" }, 404);
    return context.json({ saved: true });
  });

  app.post("/sessions/:id/analyze", async (context) => {
    const input = analysisInputSchema.safeParse(
      await context.req.json().catch(() => ({})),
    );
    if (!input.success)
      return context.json({ error: "Invalid analysis request" }, 400);
    const id = context.req.param("id");
    const view = await repository.getSession(id);
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    const analysisAnswers = {
      ...view.answers,
      ...Object.fromEntries(
        view.followUps.flatMap((followUp) =>
          followUp.userResponse
            ? [
                [
                  `followup:${followUp.questionId}:${followUp.id}`,
                  {
                    question:
                      followUp.locale === input.data.locale
                        ? followUp.generatedQuestion
                        : input.data.locale === "de"
                          ? "Zusätzliche Antwort aus der Reflexion"
                          : "Additional answer from the reflection",
                    answer: followUp.userResponse,
                  },
                ],
              ]
            : [],
        ),
      ),
      ...Object.fromEntries(
        view.coachPrompts.flatMap((prompt) =>
          prompt.userResponse
            ? [
                [
                  `coach:${prompt.chapter}:${prompt.id}`,
                  {
                    question:
                      prompt.locale === input.data.locale
                        ? prompt.question
                        : input.data.locale === "de"
                          ? "Zusätzliche Antwort aus der Reflexion"
                          : "Additional answer from the reflection",
                    answer: prompt.userResponse,
                  },
                ],
              ]
            : [],
        ),
      ),
    };

    if (
      view.session.status === "safety_paused" ||
      classifySafety(analysisAnswers) === "immediate_self_harm_risk"
    ) {
      await repository.setStatus(id, "safety_paused");
      return context.json({
        status: "safety_paused",
        message: safetyMessage(input.data.locale),
      });
    }

    if (view.analysis?.locale === input.data.locale)
      return view.entitlements.includes("full_analysis")
        ? context.json({ status: "complete", analysis: view.analysis })
        : context.json({
            status: "preview_ready",
            preview: createPreview(view),
          });

    const missing = assessmentQuestions
      .filter((question) => question.required && !(question.id in view.answers))
      .map((question) => question.id);
    if (missing.length > 0) {
      return context.json(
        { error: "Reflection is incomplete", details: missing },
        409,
      );
    }

    const result = await analyzeAnswers(
      aiProvider,
      analysisAnswers,
      id,
      input.data.locale,
    );
    const analysis = {
      version: ANALYSIS_PROMPT_VERSION,
      model: aiProvider.name,
      locale: input.data.locale,
      result,
      createdAt: new Date().toISOString(),
    };
    await repository.saveAnalysis(id, analysis);
    return view.entitlements.includes("full_analysis")
      ? context.json({ status: "complete", analysis })
      : context.json({
          status: "preview_ready",
          preview: createPreview({ ...view, analysis }),
        });
  });

  app.post("/sessions/:id/coach-prompt", async (context) => {
    const id = context.req.param("id");
    const input = coachPromptInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid Coach Prompt request" }, 400);
    const view = await repository.getSession(id);
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(view))
      return context.json({ error: "Reflection paused for safety" }, 409);
    const existing = view.coachPrompts.find(
      (prompt) => prompt.chapter === input.data.chapter,
    );
    if (existing) return context.json({ coachPrompt: existing });
    const chapterQuestions = assessmentQuestions.filter(
      (question) => question.chapter === input.data.chapter,
    );
    const atChapterBoundary =
      view.session.currentChapter === input.data.chapter &&
      view.session.currentQuestionId === chapterQuestions.at(-1)?.id;
    const complete = chapterQuestions
      .filter((question) => question.required)
      .every((question) => question.id in view.answers);
    if (!atChapterBoundary || !complete)
      return context.json({ error: "Current chapter is incomplete" }, 409);
    const chapterAnswers = Object.fromEntries(
      chapterQuestions.flatMap((question) =>
        question.id in view.answers
          ? [[question.id, view.answers[question.id]]]
          : [],
      ),
    );
    if (Object.keys(chapterAnswers).length === 0)
      return context.json({ error: "Chapter has no saved answers" }, 409);
    if (classifySafety(chapterAnswers) === "immediate_self_harm_risk") {
      await repository.setStatus(id, "safety_paused");
      return context.json({ error: "Reflection paused for safety" }, 409);
    }
    const generated = generatedCoachPromptSchema.parse(
      await aiProvider.generateCoachPrompt(
        chapterAnswers,
        id,
        input.data.locale,
      ),
    );
    const allowedIds = new Set(Object.keys(chapterAnswers));
    if (
      !generated.evidenceQuestionIds.every((answerId) =>
        allowedIds.has(answerId),
      )
    )
      return context.json(
        { error: "Coach Prompt cited unknown evidence" },
        502,
      );
    const coachPrompt = {
      id: crypto.randomUUID(),
      chapter: input.data.chapter,
      question: generated.question,
      evidenceQuestionIds: generated.evidenceQuestionIds,
      promptVersion: generated.promptVersion,
      locale: input.data.locale,
      userResponse: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    };
    await repository.saveCoachPrompt(id, coachPrompt);
    return context.json(coachPromptResponseSchema.parse({ coachPrompt }), 201);
  });

  app.put("/sessions/:id/coach-prompt/:promptId", async (context) => {
    if (!followUpIdSchema.safeParse(context.req.param("promptId")).success)
      return context.json({ error: "Invalid Coach Prompt ID" }, 400);
    const input = coachPromptResponseInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid Coach Prompt response" }, 400);
    const saved = await repository.resolveCoachPrompt(
      context.req.param("id"),
      context.req.param("promptId"),
      input.data.response,
    );
    if (!saved) return context.json({ error: "Coach Prompt not found" }, 404);
    const record = await repository.getSession(context.req.param("id"));
    if (record && (await isSafetyPaused(record)))
      return context.json({ saved: true, status: "safety_paused" });
    return context.json({ saved: true });
  });

  app.get("/sessions/:id/analysis", async (context) => {
    const view = await repository.getSession(context.req.param("id"));
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(view))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!view.analysis)
      return context.json({ error: "Analysis is not ready" }, 404);
    if (!view.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    return context.json({ analysis: view.analysis });
  });

  app.get("/sessions/:id/compass", async (context) => {
    const view = await repository.getSession(context.req.param("id"));
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(view))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!view.analysis)
      return context.json({ error: "Compass is not ready" }, 404);
    if (!view.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    return context.json({
      analysis: view.analysis,
      actionPlan: view.actionPlan,
    });
  });

  app.get("/sessions/:id/preview", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    const preview = createPreview(record);
    if (!preview) return context.json({ error: "Compass is not ready" }, 404);
    return context.json({ preview });
  });

  app.post("/sessions/:id/checkout", async (context) => {
    if (!paymentProvider || !emailProvider || !legalLinks)
      return context.json(
        { error: "Payments and email delivery are not configured" },
        503,
      );
    const input = checkoutInputSchema.safeParse(
      await context.req.json().catch(() => ({})),
    );
    if (!input.success)
      return context.json({ error: "Invalid Checkout request" }, 400);
    const id = context.req.param("id");
    const record = await repository.getSession(id);
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record)) {
      return context.json({ error: "Reflection paused for safety" }, 409);
    }
    if (!record.analysis)
      return context.json({ error: "Compass is not ready" }, 409);
    const existing = await repository.getPurchaseForSession(id);
    if (existing?.status === "paid") return context.json({ status: "paid" });
    if (existing?.status === "checkout_open")
      return context.json({
        status: "checkout_open",
        checkoutSessionId: existing.checkoutSessionId,
        url: existing.checkoutUrl,
      });
    const origin = publicAppUrl.replace(/\/$/, "");
    const checkout = await paymentProvider.createCheckout({
      sessionId: id,
      locale: input.data.locale,
      successUrl: `${origin}/${input.data.locale}/result/${id}?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${input.data.locale}/result/${id}?checkout=cancelled`,
      idempotencyKey: `checkout/${id}/${existing?.checkoutSessionId ?? "initial"}`,
    });
    await repository.saveCheckout(id, checkout);
    return context.json(
      {
        status: "checkout_open",
        checkoutSessionId: checkout.id,
        url: checkout.url,
      },
      201,
    );
  });

  app.post("/checkout/:checkoutSessionId/fulfill", async (context) => {
    if (!paymentProvider)
      return context.json({ error: "Payments are not configured" }, 503);
    const checkoutSessionId = checkoutSessionIdSchema.safeParse(
      context.req.param("checkoutSessionId"),
    );
    if (!checkoutSessionId.success)
      return context.json({ error: "Invalid Checkout Session ID" }, 400);
    const status = await fulfillCheckout({
      checkoutSessionId: checkoutSessionId.data,
      repository,
      paymentProvider,
      emailProvider,
      publicAppUrl: publicAppUrl.replace(/\/$/, ""),
    });
    return context.json(fulfillmentResponseSchema.parse({ status }));
  });

  app.post("/stripe/webhook", async (context) => {
    if (!paymentProvider)
      return context.json({ error: "Payments are not configured" }, 503);
    const signature = context.req.header("stripe-signature");
    if (!signature)
      return context.json({ error: "Missing Stripe signature" }, 400);
    let event: PaymentEvent;
    try {
      event = paymentEventSchema.parse(
        paymentProvider.parseWebhook(await context.req.text(), signature),
      );
    } catch {
      return context.json({ error: "Invalid Stripe signature" }, 400);
    }
    const claimed = await repository.claimWebhookEvent("stripe", event.id);
    if (!claimed)
      return context.json(webhookResponseSchema.parse({ received: true }));
    try {
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        await fulfillCheckout({
          checkoutSessionId: event.checkoutSessionId,
          repository,
          paymentProvider,
          emailProvider,
          publicAppUrl: publicAppUrl.replace(/\/$/, ""),
        });
      } else {
        await repository.setPurchaseStatusByCheckout(
          event.checkoutSessionId,
          event.type === "checkout.session.expired" ? "expired" : "failed",
        );
      }
      await repository.completeWebhookEvent("stripe", event.id);
    } catch (error) {
      await repository.releaseWebhookEvent("stripe", event.id);
      throw error;
    }
    return context.json(webhookResponseSchema.parse({ received: true }));
  });

  app.post("/sessions/:id/report-email", async (context) => {
    if (!emailProvider)
      return context.json({ error: "Email delivery is not configured" }, 503);
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!record.entitlements.includes("full_analysis") || !record.analysis)
      return context.json({ error: "Full Compass requires payment" }, 402);
    const purchase = await repository.getPurchaseForSession(record.session.id);
    if (!purchase?.recipientEmail)
      return context.json({ error: "Report recipient is unavailable" }, 409);
    const retry = await repository.prepareDeliveryRetry(purchase.id);
    if (!retry)
      return context.json(
        { error: "Initial report delivery is unavailable" },
        409,
      );
    try {
      const sent = await emailProvider.sendFullCompass({
        to: purchase.recipientEmail,
        locale: record.analysis.locale,
        analysis: record.analysis,
        evidence: buildReportEvidence(record),
        resultUrl: `${publicAppUrl.replace(/\/$/, "")}/${record.analysis.locale}/result/${record.session.id}`,
        idempotencyKey: `full-compass/${purchase.id}/resend/${retry.attemptCount}`,
      });
      await repository.markDeliverySent(retry.deliveryId, sent.messageId);
      return context.json({ sent: true });
    } catch (error) {
      await repository.markDeliveryFailed(
        retry.deliveryId,
        error instanceof Error ? error.name : "EmailDeliveryError",
      );
      return context.json({ error: "Report email could not be sent" }, 502);
    }
  });

  app.put("/sessions/:id/action-plan", async (context) => {
    const input = actionPlanInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid action plan" }, 400);
    const entitled = await repository.getSession(context.req.param("id"));
    if (!entitled) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(entitled))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!entitled.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    const saved = await repository.saveActionPlan(
      context.req.param("id"),
      input.data,
    );
    if (!saved) return context.json({ error: "Reflection not found" }, 404);
    const view = await repository.getSession(context.req.param("id"));
    return context.json({ actionPlan: view?.actionPlan });
  });

  if (process.env.NODE_ENV !== "production") {
    app.post("/dev/seed/:persona", async (context) => {
      const persona = seedPersonaSchema.safeParse(context.req.param("persona"));
      if (!persona.success)
        return context.json({ error: "Unknown seed persona" }, 400);
      const view = await createSeedSession(repository, persona.data);
      return context.json(
        toSessionView(view, checkoutAvailable, legalLinks),
        201,
      );
    });
  }

  app.delete("/sessions/:id", async (context) => {
    const deleted = await repository.deleteSession(context.req.param("id"));
    if (!deleted) return context.json({ error: "Reflection not found" }, 404);
    return context.body(null, 204);
  });

  app.notFound((context) => context.json({ error: "Not found" }, 404));
  app.onError((error, context) => {
    console.error("Unhandled API error", { name: error.name });
    return context.json({ error: "Something went wrong" }, 500);
  });

  return app;
}

export const firstQuestionId = assessmentQuestions[0].id;
