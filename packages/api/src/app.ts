import {
  type AnalysisPreview,
  actionPlanInputSchema,
  analysisInputSchema,
  assessmentQuestions,
  buildCheckpoint,
  checkoutInputSchema,
  checkoutSessionIdSchema,
  checkpointSchema,
  coachPromptResponseInputSchema,
  createDigitalPurchaseAgreement,
  directionReviewSchema,
  followUpIdSchema,
  fulfillmentResponseSchema,
  localeSchema,
  missingFreeAnswers,
  paidJourneySchema,
  paymentEventSchema,
  purchaseOfferSchema,
  refinementAnswerSchema,
  refinementPlanSchema,
  saveAnswerInputSchema,
  seedPersonaSchema,
  sessionIdSchema,
  sessionViewSchema,
  updateSessionInputSchema,
  validateQuestionAnswer,
  webhookResponseSchema,
} from "@wtfiwant/shared";
import { type Context, Hono, type Next } from "hono";
import { buildAnalysisAnswers } from "./ai/analysis";
import { LocalAIProvider } from "./ai/local";
import type { AIProvider } from "./ai/provider";
import { analyticsRoutes } from "./analytics/routes";
import { type AnalyticsStore, analyticsBestEffort } from "./analytics/store";
import { buildReportEvidence, fulfillCheckout } from "./commerce/fulfillment";
import type { PaymentEvent, PaymentProvider } from "./commerce/payment";
import { withdrawalRoutes } from "./commerce/withdrawal";
import { createSeedSession } from "./dev/personas";
import type { EmailDeliveryProvider } from "./email/provider";
import { ensurePaidPlan, paidJourneyView } from "./journey/service";
import { type AIJobStore, InMemoryAIJobStore } from "./journey/store";
import { renderCompassPdf } from "./report/pdf";
import type {
  AssessmentRecord,
  AssessmentRepository,
} from "./repositories/types";
import { buildSafetyAnswers } from "./safety/answers";
import { classifySafety, SAFETY_MESSAGE } from "./safety/classifier";

type AppDependencies = {
  repository: AssessmentRepository;
  jobs?: AIJobStore;
  analytics?: AnalyticsStore;
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
    preview: null,
    actionPlan: full ? record.actionPlan : null,
    entitlements: record.entitlements,
    checkoutAvailable,
    legalLinks: legalLinks ?? null,
  });
}

export function createApp({
  repository,
  jobs = new InMemoryAIJobStore(repository),
  analytics,
  aiProvider = new LocalAIProvider(),
  paymentProvider,
  emailProvider,
  publicAppUrl = "http://localhost:3000",
  legalLinks,
  basePath = "/",
}: AppDependencies) {
  const app = new Hono().basePath(basePath);
  // Private responses and errors must not be retained by browsers or proxies.
  app.use("*", async (context, next) => {
    context.header("Cache-Control", "private, no-store");
    context.header("Referrer-Policy", "no-referrer");
    context.header("X-Robots-Tag", "noindex, nofollow");
    context.header("X-Content-Type-Options", "nosniff");
    await next();
  });
  app.get("/analytics/config", (context) => {
    context.header("Cache-Control", "no-store");
    return context.json({ enabled: Boolean(analytics) });
  });
  if (analytics)
    app.route("/analytics", analyticsRoutes(analytics, publicAppUrl));
  app.route("/withdrawals", withdrawalRoutes(repository, emailProvider));
  const checkoutAvailable = Boolean(
    paymentProvider && emailProvider && legalLinks,
  );

  const journeyView = async (sessionId: string) => {
    const view = await paidJourneyView(jobs, sessionId);
    const purchase = await repository.getPurchaseForSession(sessionId);
    if (
      view &&
      purchase?.agreement?.confirmationBeforeAI &&
      !(await repository.commerce.purchaseConfirmed(purchase.id))
    ) {
      return { ...view, canSkip: false, purchaseConfirmationPending: true };
    }
    return view;
  };

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
    const purchased = await repository.getPurchaseForSession(
      context.req.param("id"),
    );
    if (purchased?.status === "paid")
      return context.json(
        { error: "Purchased reflection answers are frozen" },
        409,
      );
    const saved = await repository.saveAnswer(
      context.req.param("id"),
      context.req.param("questionId"),
      input.data.value,
    );
    if (!saved) return context.json({ error: "Reflection not found" }, 404);
    return context.json({ saved: true });
  });

  app.get("/commerce/offer", async (context) => {
    if (!checkoutAvailable || !paymentProvider?.getOffer)
      return context.json({ offer: null });
    try {
      return context.json({
        offer: purchaseOfferSchema.parse(await paymentProvider.getOffer()),
      });
    } catch {
      return context.json(
        { error: "Purchase price is temporarily unavailable" },
        503,
      );
    }
  });

  app.get("/sessions/:id/checkpoint", async (context) => {
    const locale = localeSchema.safeParse(context.req.query("locale") ?? "en");
    if (!locale.success)
      return context.json({ error: "Invalid language" }, 400);
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({
        status: "safety_paused",
        message: safetyMessage(locale.data),
      });
    const missing = missingFreeAnswers(record.answers);
    if (missing.length)
      return context.json(
        { error: "Reflection is incomplete", details: missing },
        409,
      );
    return context.json({
      checkpoint: checkpointSchema.parse(
        buildCheckpoint(record.answers, locale.data),
      ),
    });
  });

  app.post("/sessions/:id/paid/start", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!record.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    const purchase = await repository.getPurchaseForSession(record.session.id);
    await ensurePaidPlan(
      jobs,
      record,
      purchase?.agreement?.locale ?? record.analysis?.locale ?? "en",
      aiProvider,
    );
    return context.json(
      paidJourneySchema.parse(await journeyView(record.session.id)),
    );
  });

  app.get("/sessions/:id/paid", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json(
        paidJourneySchema.parse({
          locale: (await jobs.get(record.session.id, "plan"))?.locale ?? "en",
          stage: "safety_paused",
          questions: [],
          responses: {},
          canSkip: false,
          delivery: "pending",
        }),
      );
    if (!record.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    const journey = await journeyView(record.session.id);
    if (!journey)
      return context.json({ error: "Paid journey has not started" }, 409);
    return context.json(paidJourneySchema.parse(journey));
  });

  app.put("/sessions/:id/paid/answers/:questionId", async (context) => {
    const input = refinementAnswerSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid refinement answer" }, 400);
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!record.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    const plan = await jobs.get(record.session.id, "plan");
    const parsed = refinementPlanSchema.safeParse(plan?.result);
    if (
      !parsed.success ||
      !parsed.data.questions.some(
        (question) => question.id === context.req.param("questionId"),
      )
    )
      return context.json({ error: "Unknown refinement question" }, 400);
    const saved = await jobs.answer(
      record.session.id,
      context.req.param("questionId"),
      input.data.response,
    );
    if (!saved)
      return context.json({ error: "Refinement is already finished" }, 409);
    if (
      input.data.response &&
      classifySafety({ response: input.data.response }) ===
        "immediate_self_harm_risk"
    ) {
      await repository.setStatus(record.session.id, "safety_paused");
      return context.json({ saved: true, status: "safety_paused" });
    }
    return context.json({ saved: true });
  });

  app.post("/sessions/:id/paid/synthesize", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!record.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    const plan = await jobs.get(record.session.id, "plan");
    if (!plan)
      return context.json({ error: "Start the paid journey first" }, 409);
    await jobs.enqueue(record.session.id, "synthesis", plan.locale, plan.input);
    return context.json(
      paidJourneySchema.parse(await journeyView(record.session.id)),
      202,
    );
  });

  app.post("/sessions/:id/paid/generate", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (!record.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    // A replay cannot change the confirmed direction or create another paid AI job.
    if (await jobs.get(record.session.id, "report"))
      return context.json(
        paidJourneySchema.parse(await journeyView(record.session.id)),
      );
    const input = directionReviewSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json(
        { error: "Review your proposed direction first" },
        400,
      );
    const synthesis = await jobs.get(record.session.id, "synthesis");
    if (!synthesis || synthesis.status !== "ready")
      return context.json(
        { error: "Your direction is not ready to review" },
        409,
      );
    if (classifySafety(input.data) === "immediate_self_harm_risk") {
      await repository.setStatus(record.session.id, "safety_paused");
      return context.json({ error: "Reflection paused for safety" }, 409);
    }
    await jobs.saveReview(record.session.id, input.data);
    await jobs.enqueue(
      record.session.id,
      "report",
      synthesis.locale,
      synthesis.input,
    );
    return context.json(
      paidJourneySchema.parse(await journeyView(record.session.id)),
      202,
    );
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
    const analysisAnswers = buildAnalysisAnswers(view, input.data.locale);

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

    // Retired generation endpoint: never allow unpaid previews or repeated
    // locale requests to spend tokens. Paid generation uses immutable jobs.
    if (!view.entitlements.includes("full_analysis")) {
      const missing = missingFreeAnswers(view.answers);
      if (missing.length)
        return context.json(
          { error: "Reflection is incomplete", details: missing },
          409,
        );
      return context.json({
        status: "checkpoint_ready",
        checkpoint: buildCheckpoint(view.answers, input.data.locale),
      });
    }
    if (
      !view.analysis ||
      ((await jobs.get(id, "plan")) &&
        (await jobs.get(id, "report"))?.status !== "ready")
    )
      return context.json({ error: "Use the paid report workflow" }, 409);
    return context.json({ status: "complete", analysis: view.analysis });
  });

  app.post("/sessions/:id/coach-prompt", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    return context.json(
      {
        error: record.entitlements.includes("full_analysis")
          ? "Use the paid refinement workflow"
          : "AI follow-ups require payment",
      },
      record.entitlements.includes("full_analysis") ? 410 : 402,
    );
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
    if (
      (await jobs.get(view.session.id, "plan")) &&
      (await jobs.get(view.session.id, "report"))?.status !== "ready"
    )
      return context.json({ error: "Your report is being prepared" }, 409);
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
    if (
      (await jobs.get(view.session.id, "plan")) &&
      (await jobs.get(view.session.id, "report"))?.status !== "ready"
    )
      return context.json({ error: "Your report is being prepared" }, 409);
    if (!view.analysis)
      return context.json({ error: "Compass is not ready" }, 404);
    if (!view.entitlements.includes("full_analysis"))
      return context.json({ error: "Full Compass requires payment" }, 402);
    return context.json({
      analysis: view.analysis,
      evidence: buildReportEvidence(
        view,
        (await jobs.get(view.session.id, "report"))?.input.answers,
      ),
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
    const missing = missingFreeAnswers(record.answers);
    if (missing.length)
      return context.json(
        { error: "Complete your free checkpoint first", details: missing },
        409,
      );
    const existing = await repository.getPurchaseForSession(id);
    if (existing?.status === "refunded")
      return context.json(
        {
          error:
            "This purchase was refunded. Start a new reflection to purchase again.",
        },
        409,
      );
    if (existing?.status === "paid") return context.json({ status: "paid" });
    const attribution = input.data.analytics;
    if (existing?.status === "checkout_open") {
      // An expiry webhook can be delayed or missed. Never send a returning
      // customer to a dead Checkout, or create another payment if already paid.
      const checkout = await paymentProvider.retrieveCheckout(
        existing.checkoutSessionId,
      );
      if (checkout.paymentStatus === "paid") {
        await fulfillCheckout({
          checkoutSessionId: checkout.id,
          repository,
          paymentProvider,
          aiProvider,
          jobs,
          emailProvider,
          analytics,
          publicAppUrl,
        });
        return context.json({ status: "paid" });
      }
      if (checkout.checkoutStatus === "expired")
        await repository.setPurchaseStatusByCheckout(checkout.id, "expired");
      else {
        if (attribution)
          await analyticsBestEffort(
            () =>
              analytics?.checkout(
                existing.checkoutSessionId,
                attribution,
                input.data.locale,
              ) ?? Promise.resolve(),
          );
        return context.json({
          status: "checkout_open",
          checkoutSessionId: existing.checkoutSessionId,
          url: existing.checkoutUrl,
        });
      }
    }
    const origin = publicAppUrl.replace(/\/$/, "");
    const agreement = createDigitalPurchaseAgreement(input.data.locale);
    const checkout = await paymentProvider.createCheckout({
      sessionId: id,
      locale: input.data.locale,
      successUrl: `${origin}/${input.data.locale}/result/${id}?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${input.data.locale}/result/${id}?checkout=cancelled`,
      idempotencyKey: `checkout/${id}/${existing?.checkoutSessionId ?? "initial"}`,
      agreement,
      termsUrl: legalLinks.termsUrl,
      refundPolicyUrl: legalLinks.refundPolicyUrl,
    });
    await repository.saveCheckout(id, checkout, agreement);
    if (attribution)
      await analyticsBestEffort(
        () =>
          analytics?.checkout(checkout.id, attribution, input.data.locale) ??
          Promise.resolve(),
      );
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
      aiProvider,
      jobs,
      repository,
      paymentProvider,
      emailProvider,
      analytics,
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
        await paymentProvider.parseWebhook(await context.req.text(), signature),
      );
    } catch {
      return context.json({ error: "Invalid Stripe signature" }, 400);
    }
    const claimed = await repository.claimWebhookEvent("stripe", event.id);
    if (!claimed)
      return context.json(webhookResponseSchema.parse({ received: true }));
    try {
      if (!("checkoutSessionId" in event)) {
        await repository.commerce.recordAdjustment(event);
      } else if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        await fulfillCheckout({
          checkoutSessionId: event.checkoutSessionId,
          aiProvider,
          jobs,
          repository,
          paymentProvider,
          emailProvider,
          analytics,
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

  app.get("/sessions/:id/report.pdf", async (context) => {
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (
      (await jobs.get(record.session.id, "plan")) &&
      (await jobs.get(record.session.id, "report"))?.status !== "ready"
    )
      return context.json({ error: "Your report is being prepared" }, 409);
    if (!record.entitlements.includes("full_analysis") || !record.analysis)
      return context.json({ error: "Full Compass requires payment" }, 402);
    const locale = localeSchema.safeParse(
      context.req.query("locale") ?? record.analysis.locale,
    );
    if (!locale.success)
      return context.json({ error: "Invalid report language" }, 400);
    const analysis = record.analysis;
    const pdf = await renderCompassPdf(
      analysis.result,
      analysis.locale,
      buildReportEvidence(
        { ...record, analysis },
        (await jobs.get(record.session.id, "report"))?.input.answers,
      ),
      record.actionPlan,
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="wtfiwant-compass-${analysis.locale}.pdf"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  });

  app.post("/sessions/:id/report-email", async (context) => {
    if (!emailProvider)
      return context.json({ error: "Email delivery is not configured" }, 503);
    const record = await repository.getSession(context.req.param("id"));
    if (!record) return context.json({ error: "Reflection not found" }, 404);
    if (await isSafetyPaused(record))
      return context.json({ error: "Reflection paused for safety" }, 409);
    if (
      (await jobs.get(record.session.id, "plan")) &&
      (await jobs.get(record.session.id, "report"))?.status !== "ready"
    )
      return context.json({ error: "Your report is being prepared" }, 409);
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
      const analysis = record.analysis;
      const sent = await emailProvider.sendFullCompass({
        to: purchase.recipientEmail,
        locale: analysis.locale,
        analysis,
        evidence: buildReportEvidence(
          { ...record, analysis },
          (await jobs.get(record.session.id, "report"))?.input.answers,
        ),
        actionPlan: record.actionPlan,
        resultUrl: `${publicAppUrl.replace(/\/$/, "")}/${analysis.locale}/result/${record.session.id}`,
        idempotencyKey: `full-compass/${purchase.id}/resend/${retry.attemptCount}`,
        purchase,
      });
      await repository.markDeliverySent(retry.deliveryId, sent.messageId);
      const reportJob = await jobs.get(record.session.id, "report");
      if (reportJob) await jobs.delivered(reportJob, "sent");
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
      const input = analysisInputSchema.safeParse(
        await context.req.json().catch(() => ({})),
      );
      if (!input.success)
        return context.json({ error: "Invalid seed request" }, 400);
      const view = await createSeedSession(
        repository,
        persona.data,
        input.data.locale,
      );
      return context.json(
        toSessionView(view, checkoutAvailable, legalLinks),
        201,
      );
    });
  }

  app.delete("/sessions/:id", async (context) => {
    const deleted = await repository.deleteSession(context.req.param("id"));
    if (!deleted) return context.json({ error: "Reflection not found" }, 404);
    await jobs.delete(context.req.param("id"));
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
