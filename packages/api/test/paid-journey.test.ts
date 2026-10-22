import { describe, expect, test } from "bun:test";
import {
  buildCheckpoint,
  freeJourney,
  type Locale,
  missingFreeAnswers,
  paidJourneySchema,
  tradeoffPairs,
} from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import { createApp } from "../src/app";
import type {
  CheckoutDetails,
  CheckoutRequest,
  PaymentProvider,
} from "../src/commerce/payment";
import { LocalEmailDeliveryProvider } from "../src/email/local";
import type { FullCompassEmail } from "../src/email/provider";
import { deliverReadyReports, processAIJob } from "../src/journey/process";
import { InMemoryAIJobStore } from "../src/journey/store";
import { buildAnalysisInput } from "../src/prompts/analysis";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

class Payments implements PaymentProvider {
  details: CheckoutDetails | null = null;
  async createCheckout(input: CheckoutRequest) {
    this.details = {
      id: "cs_test_journey",
      sessionId: input.sessionId,
      checkoutStatus: "complete",
      paymentStatus: "unpaid",
      recipientEmail: "test@example.com",
      paymentIntentId: "pi_test",
      currency: "eur",
      amountTotal: 1900,
      consentAccepted: true,
    };
    return { id: this.details.id, url: "https://checkout.stripe.test/journey" };
  }
  async retrieveCheckout() {
    if (!this.details) throw new Error("No checkout");
    return this.details;
  }
  parseWebhook(_payload: string, signature: string) {
    if (signature !== "valid") throw new Error("Invalid signature");
    return {
      id: "evt_test_journey",
      type: "checkout.session.completed" as const,
      checkoutSessionId: "cs_test_journey",
    };
  }
}
const freeAnswers = {
  "life.energy": ["Work"],
  "life.chosen": "Working with a team I chose.",
  "alive.memories": {
    memories: [{ story: "Cooking slowly with my oldest friends." }],
  },
  "noise.working_toward": "A promotion with room for time outside work",
  "noise.private_desire": "Definitely",
  "life.drifted": "A full calendar by default",
  "tradeoffs.choices": {
    choices: tradeoffPairs.map(() => -1),
    touched: tradeoffPairs.map(() => true),
  },
};
function setup() {
  let now = Date.now();
  let planCalls = 0,
    reportCalls = 0;
  const repository = new InMemoryAssessmentRepository(() => now);
  const jobs = new InMemoryAIJobStore(repository, () => now);
  const paymentProvider = new Payments();
  const sent: FullCompassEmail[] = [];
  let emailFails = false;
  class Email extends LocalEmailDeliveryProvider {
    async sendFullCompass(input: FullCompassEmail) {
      if (emailFails) throw new Error("Offline");
      sent.push(input);
      return { messageId: "message_test" };
    }
  }
  class AI extends LocalAIProvider {
    name = "paid-test-model";
    async generateRefinementPlan(
      _answers: Record<string, unknown>,
      _id: string,
      locale: Locale,
    ) {
      planCalls++;
      return {
        questions: [
          {
            id: "q1" as const,
            question:
              locale === "de"
                ? "Welche Veränderung würdest du in deinem Alltag zuerst testen?"
                : "Which change in your everyday life would you test first?",
            evidenceQuestionIds: ["noise.working_toward"],
          },
        ],
      };
    }
    async analyzeAssessment(
      ...args: Parameters<LocalAIProvider["analyzeAssessment"]>
    ) {
      reportCalls++;
      return super.analyzeAssessment(...args);
    }
  }
  const aiProvider = new AI();
  const dependencies = {
    repository,
    jobs,
    aiProvider,
    emailProvider: new Email(),
    publicAppUrl: "https://wtfiwant.test",
  };
  const app = createApp({
    ...dependencies,
    paymentProvider,
    legalLinks: {
      termsUrl: "https://wtfiwant.test/terms",
      refundPolicyUrl: "https://wtfiwant.test/refunds",
    },
  });
  const post = (path: string, body: unknown = {}) =>
    app.request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const create = async () => {
    const record = await repository.createSession();
    for (const [id, value] of Object.entries(freeAnswers))
      await repository.saveAnswer(record.session.id, id, value);
    return record.session.id;
  };
  const pay = async (id: string, locale: Locale = "de") => {
    expect((await post(`/sessions/${id}/checkout`, { locale })).status).toBe(
      201,
    );
    if (!paymentProvider.details) throw new Error("Missing checkout");
    paymentProvider.details.paymentStatus = "paid";
    expect((await post("/checkout/cs_test_journey/fulfill")).status).toBe(200);
  };
  return {
    ...dependencies,
    app,
    post,
    create,
    pay,
    paymentProvider,
    sent,
    counts: () => ({ planCalls, reportCalls }),
    advance: (ms: number) => {
      now += ms;
    },
    finish: async (id: string) => {
      await post(`/sessions/${id}/paid/synthesize`);
      await processAIJob(dependencies);
      const draft = (await jobs.get(id, "synthesis"))?.result as {
        northStar: string;
        priority: string;
      };
      expect(
        (
          await post(`/sessions/${id}/paid/generate`, {
            alignment: "fits",
            northStar: draft.northStar,
            priority: draft.priority,
            feedback: "",
          })
        ).status,
      ).toBe(202);
      await processAIJob(dependencies);
    },
    failEmail: (value: boolean) => {
      emailFails = value;
    },
  };
}

describe("paid adaptive reflection", () => {
  test("selects the free branch from the previous goal answer and validates that branch", () => {
    expect(freeJourney(freeAnswers).map((q) => q.id)).toContain("life.drifted");
    const changed = { ...freeAnswers, "noise.private_desire": "Probably not" };
    expect(freeJourney(changed).map((q) => q.id)).toContain("noise.supposed");
    expect(missingFreeAnswers(changed)).toEqual(["noise.supposed"]);
    expect(buildCheckpoint(freeAnswers, "de").tradeoffs[0].left).toBe(
      "Mehr Freiheit",
    );
  });

  test("all unpaid endpoints including cached legacy reports make zero AI calls", async () => {
    const t = setup();
    const id = await t.create();
    expect((await t.post(`/sessions/${id}/analyze`)).status).toBe(200);
    expect(
      (await t.app.request(`/sessions/${id}/checkpoint?locale=de`)).status,
    ).toBe(200);
    for (const suffix of [
      "paid/start",
      "paid/synthesize",
      "paid/generate",
      "coach-prompt",
    ])
      expect((await t.post(`/sessions/${id}/${suffix}`)).status).toBe(402);
    expect((await t.app.request(`/sessions/${id}/report.pdf`)).status).toBe(
      402,
    );
    expect(await processAIJob(t)).toBe(false);
    expect(t.counts()).toEqual({ planCalls: 0, reportCalls: 0 });
    expect((await t.repository.getSession(id))?.analysis).toBeNull();
  });

  test("rejects incomplete checkout and keeps pending payments locked", async () => {
    const t = setup();
    const incomplete = await t.repository.createSession();
    expect(
      (await t.post(`/sessions/${incomplete.session.id}/checkout`)).status,
    ).toBe(409);
    const id = await t.create();
    await t.post(`/sessions/${id}/checkout`);
    expect(
      await (await t.post("/checkout/cs_test_journey/fulfill")).json(),
    ).toEqual({ status: "processing" });
    expect(await t.jobs.get(id, "plan")).toBeNull();
    expect((await t.post(`/sessions/${id}/paid/start`)).status).toBe(402);
    expect(t.counts()).toEqual({ planCalls: 0, reportCalls: 0 });
  });

  test("queues once, resumes refinement and publishes a localized report independently of webhooks", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await Promise.all([
      t.post("/checkout/cs_test_journey/fulfill"),
      t.post(`/sessions/${id}/paid/start`),
      t.post(`/sessions/${id}/paid/start`),
    ]);
    expect(t.counts()).toEqual({ planCalls: 0, reportCalls: 0 });
    expect(t.sent).toHaveLength(0);
    expect((await t.app.request(`/sessions/${id}/compass`)).status).toBe(409);
    await Promise.all([processAIJob(t), processAIJob(t)]);
    expect(t.counts().planCalls).toBe(1);
    let state = paidJourneySchema.parse(
      await (await t.app.request(`/sessions/${id}/paid`)).json(),
    );
    expect(state.stage).toBe("refining");
    expect(state.locale).toBe("de");
    expect(
      (
        await t.app.request(`/sessions/${id}/paid/answers/q1`, {
          method: "PUT",
          body: JSON.stringify({
            response: "One meeting-free afternoon each week.",
          }),
        })
      ).status,
    ).toBe(200);
    state = paidJourneySchema.parse(
      await (await t.app.request(`/sessions/${id}/paid`)).json(),
    );
    expect(state.responses.q1).toContain("meeting-free");
    expect((await t.post(`/sessions/${id}/paid/generate`)).status).toBe(400);
    await Promise.all([
      t.post(`/sessions/${id}/paid/synthesize`),
      t.post(`/sessions/${id}/paid/synthesize`),
    ]);
    await Promise.all([processAIJob(t), processAIJob(t)]);
    const proposed = (await t.jobs.get(id, "synthesis"))?.result as {
      northStar: string;
      priority: string;
    };
    state = paidJourneySchema.parse(
      await (await t.app.request(`/sessions/${id}/paid`)).json(),
    );
    expect(state.stage).toBe("reviewing");
    expect(state.draft?.northStar).toBe(proposed.northStar);
    await Promise.all(
      [1, 2].map(() =>
        t.post(`/sessions/${id}/paid/generate`, {
          alignment: "adjusted",
          northStar: "Room for friends and creative work",
          priority: "Protect an afternoon before seeking promotion",
          feedback: "The promotion is not my immediate priority.",
        }),
      ),
    );
    await Promise.all([processAIJob(t), processAIJob(t)]);
    const saved = (await t.repository.getSession(id))?.analysis?.result;
    expect(saved?.compass?.northStar).toBe(
      "Room for friends and creative work",
    );
    expect(saved?.compass?.priority).toBe(
      "Protect an afternoon before seeking promotion",
    );
    expect(saved?.directionStatus).toBe("adjusted");
    expect(t.counts()).toEqual({ planCalls: 1, reportCalls: 1 });
    const full = (await (
      await t.app.request(`/sessions/${id}/compass`)
    ).json()) as { analysis: { locale: string; result: { summary: string } } };
    expect(full.analysis.locale).toBe("de");
    expect(full.analysis.result.summary).toContain("Deine Antworten");
    expect(
      (await t.jobs.get(id, "report"))?.input.answers["refinement:q1"],
    ).toEqual({
      question: state.questions[0].question,
      answer: state.responses.q1,
    });
    await deliverReadyReports(t);
    await deliverReadyReports(t);
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0].locale).toBe("de");
    await t.post(`/sessions/${id}/analyze`, { locale: "en" });
    await t.post(`/sessions/${id}/paid/generate`);
    expect(await processAIJob(t)).toBe(false);
    expect(
      (await t.app.request(`/sessions/${id}/report.pdf?locale=en`)).headers.get(
        "content-type",
      ),
    ).toBe("application/pdf");
    expect(t.counts().reportCalls).toBe(1);
  });

  test("skipping refinement cancels queued planning and never blocks on email failure", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await t.finish(id);
    expect(t.counts()).toEqual({ planCalls: 0, reportCalls: 1 });
    t.failEmail(true);
    await deliverReadyReports(t);
    expect((await t.app.request(`/sessions/${id}/compass`)).status).toBe(200);
    expect((await t.jobs.get(id, "report"))?.deliveryState).toBe("failed");
    t.advance(180_000);
    t.failEmail(false);
    await deliverReadyReports(t);
    expect(t.sent).toHaveLength(1);
    expect(t.counts().reportCalls).toBe(1);
  });

  test("recovers when email was sent before the worker could acknowledge its job", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await t.finish(id);
    const purchase = await t.repository.getPurchaseForSession(id);
    if (!purchase) throw new Error("Missing purchase");
    const delivery = await t.repository.claimInitialDelivery(purchase.id);
    if (!delivery) throw new Error("Missing delivery");
    await t.repository.markDeliverySent(delivery);
    await deliverReadyReports(t);
    expect((await t.jobs.get(id, "report"))?.deliveryState).toBe("sent");
    expect(t.sent).toHaveLength(0);
  });

  test("automatically delivers after optional refinement is abandoned", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await processAIJob(t);
    t.advance(31 * 60_000);
    await processAIJob(t);
    expect(await t.jobs.get(id, "report")).toBeNull();
    t.advance(31 * 60_000);
    await processAIJob(t);
    expect(
      (await t.repository.getSession(id))?.analysis?.result.directionStatus,
    ).toBe("not_reviewed");
    await deliverReadyReports(t);
    expect(t.counts()).toEqual({ planCalls: 1, reportCalls: 1 });
    expect(t.sent).toHaveLength(1);
  });

  test("leases fence stale workers and exhausted retries cannot be reset by the browser", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    const stale = await t.jobs.claim();
    if (!stale) throw new Error("No job");
    t.advance(301_000);
    const reclaimed = await t.jobs.claim();
    if (!reclaimed) throw new Error("No retry");
    expect(await t.jobs.complete(stale, { questions: [] })).toBe(false);
    await t.jobs.fail(reclaimed);
    t.advance(300_000);
    const final = await t.jobs.claim();
    if (!final) throw new Error("No final attempt");
    await t.jobs.fail(final);
    for (let i = 0; i < 5; i++) await t.post(`/sessions/${id}/paid/start`);
    expect((await t.jobs.get(id, "plan"))?.attempts).toBe(3);
    expect(await t.jobs.claim()).toBeNull();
  });

  test("safety pauses optional paid answers before any report generation", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await processAIJob(t);
    await t.app.request(`/sessions/${id}/paid/answers/q1`, {
      method: "PUT",
      body: JSON.stringify({ response: "I plan to end my life today" }),
    });
    expect((await t.post(`/sessions/${id}/paid/generate`)).status).toBe(409);
    expect((await t.repository.getSession(id))?.session.status).toBe(
      "safety_paused",
    );
    expect(t.counts().reportCalls).toBe(0);
  });

  test("recovers a saved review after an interrupted report enqueue without inventing approval", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await t.post(`/sessions/${id}/paid/synthesize`);
    await processAIJob(t);
    const draft = (await t.jobs.get(id, "synthesis"))?.result as {
      northStar: string;
      priority: string;
    };
    await t.jobs.saveReview(id, {
      alignment: "unsure",
      northStar: draft.northStar,
      priority: draft.priority,
      feedback: "I need to try this before deciding.",
    });
    expect(await t.jobs.get(id, "report")).toBeNull();
    await processAIJob(t);
    expect(
      (await t.repository.getSession(id))?.analysis?.result.directionStatus,
    ).toBe("unsure");
    expect(t.counts().reportCalls).toBe(1);
  });

  test("safety checks user corrections before final generation", async () => {
    const t = setup();
    const id = await t.create();
    await t.pay(id);
    await t.post(`/sessions/${id}/paid/synthesize`);
    await processAIJob(t);
    const response = await t.post(`/sessions/${id}/paid/generate`, {
      alignment: "adjusted",
      northStar: "I plan to end my life today",
      priority: "Leave my obligations behind",
      feedback: "This is my plan for today.",
    });
    expect(response.status).toBe(409);
    expect((await t.repository.getSession(id))?.session.status).toBe(
      "safety_paused",
    );
    expect(await t.jobs.get(id, "report")).toBeNull();
    expect(t.counts().reportCalls).toBe(0);
  });

  test("analysis input includes question wording and the meaning of numeric trade-offs", () => {
    const prompt = buildAnalysisInput(freeAnswers, false, "de");
    expect(prompt).toContain("Mehr Freiheit");
    expect(prompt).toContain("Mehr Sicherheit");
    expect(prompt).toContain("noise.working_toward");
    expect(prompt).toContain("Worauf");
  });
});
