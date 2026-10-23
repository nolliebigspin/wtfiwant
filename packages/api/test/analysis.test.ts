import { describe, expect, test } from "bun:test";
import {
  type Analysis,
  createDigitalPurchaseAgreement,
  sessionViewSchema,
} from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import { localCompass, localDirection } from "../src/ai/local-compass";
import type { AIProvider } from "../src/ai/provider";
import { createApp } from "../src/app";
import { deliverCommerceNotifications } from "../src/commerce/notifications";
import { createSeedSession } from "../src/dev/personas";
import { LocalEmailDeliveryProvider } from "../src/email/local";
import { processAIJob } from "../src/journey/process";
import { InMemoryAIJobStore } from "../src/journey/store";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

const validAnalysis: Analysis = {
  summary:
    "Your answers suggest that self-direction and close relationships both matter.",
  coreDrivers: [
    {
      id: "autonomy",
      name: "Autonomy",
      explanation: "You repeatedly described wanting control over your time.",
      evidenceQuestionIds: ["life.chosen"],
      confidence: "medium",
    },
    {
      id: "connection",
      name: "Connection",
      explanation: "Your alive moments include people you trust.",
      evidenceQuestionIds: ["alive.memories"],
      confidence: "medium",
    },
    {
      id: "growth",
      name: "Growth",
      explanation: "Chosen challenges appear to matter.",
      evidenceQuestionIds: ["goals.current"],
      confidence: "low",
    },
  ],
  tensions: [],
  externalInfluences: [],
  antiLife: {
    themes: ["Time controlled by work"],
    summary: "A life where work consumes the time you want to direct yourself.",
    evidenceQuestionIds: ["anti_life.description"],
  },
  possibleDirections: [
    {
      title: "Test more autonomy",
      explanation: "Try a bounded change to how you work.",
      whyItFits: "It directly tests a repeated preference.",
      evidenceQuestionIds: ["life.chosen"],
    },
    {
      title: "Protect close relationships",
      explanation: "Design autonomy without disappearing from your people.",
      whyItFits: "Connection appears alongside independence.",
      evidenceQuestionIds: ["alive.memories"],
    },
  ],
  goals: [],
  firstSteps: [
    {
      direction: "Build more autonomy into work",
      experiment: "Try one remote workday each week for a month",
      immediateAction: "Ask which day could work",
      evidenceQuestionIds: ["goals.current"],
    },
  ],
};

describe("analysis validation", () => {
  test("generates development reports in the requested locale and rejects unsupported locales", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });
    const seed = (locale: string) =>
      app.request("/dev/seed/burned_out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
    const response = await seed("de");
    expect(response.status).toBe(201);
    const view = sessionViewSchema.parse(await response.json());
    expect(view.preview).toBeNull();
    expect(
      (
        await (
          await app.request(`/sessions/${view.session.id}/checkpoint?locale=de`)
        ).json()
      ).checkpoint.locale,
    ).toBe("de");
    expect((await seed("fr")).status).toBe(400);
  });

  test("local fallback keeps the same analysis behavior when translating to German", async () => {
    const provider = new LocalAIProvider();
    const answers = {
      "life.chosen": "Freedom with close friends and meaningful work",
      "alive.memories": "Travel with my community",
      "anti_life.description": "No time and constant stress",
      "goals.current": {
        goals: [{ goal: "Build something", why: "More autonomy" }],
      },
    };
    const english = await provider.analyzeAssessment(
      answers,
      false,
      "test",
      "en",
    );
    const german = await provider.analyzeAssessment(
      answers,
      false,
      "test",
      "de",
    );

    expect(german.coreDrivers.map((driver) => driver.id)).toEqual(
      english.coreDrivers.map((driver) => driver.id),
    );
    expect(german.tensions.map((tension) => tension.id)).toEqual(
      english.tensions.map((tension) => tension.id),
    );
    expect(german.goals).toHaveLength(english.goals.length);
    expect(german.summary).not.toBe(english.summary);
  });

  test("repairs malformed output once in a paid job and includes refinement evidence", async () => {
    const repository = new InMemoryAssessmentRepository();
    const seeded = await createSeedSession(repository, "burned_out", "de");
    const id = seeded.session.id;
    await repository.saveCheckout(
      id,
      { id: "cs_test_analysis", url: "https://stripe.test/checkout" },
      createDigitalPurchaseAgreement("de"),
    );
    await repository.markPurchasePaid({
      checkoutSessionId: "cs_test_analysis",
      recipientEmail: "test@example.com",
      paymentIntentId: null,
      currency: "eur",
      amountTotal: 1900,
      consentRecordedAt: new Date().toISOString(),
    });
    let attempts = 0;
    await deliverCommerceNotifications(
      repository.commerce,
      new LocalEmailDeliveryProvider(),
    );
    const locales: string[] = [];
    let answers: Record<string, unknown> = {};
    const provider: AIProvider = {
      name: "test-model",
      async generateFollowUp() {
        throw new Error("Not used");
      },
      async generateCoachPrompt() {
        throw new Error("Not used");
      },
      async generateDirection(input, _id, locale) {
        return localDirection(input, locale);
      },
      async analyzeAssessment(input, repair, _id, locale) {
        attempts++;
        answers = input;
        locales.push(locale ?? "missing");
        return repair
          ? {
              ...validAnalysis,
              compass: localCompass(validAnalysis, input, locale ?? "en"),
            }
          : { summary: "missing required fields" };
      },
    };
    const jobs = new InMemoryAIJobStore(repository);
    const dependencies = {
      repository,
      jobs,
      aiProvider: provider,
      publicAppUrl: "https://wtfiwant.test",
    };
    const app = createApp(dependencies);
    await app.request(`/sessions/${id}/paid/start`, { method: "POST" });
    await processAIJob(dependencies);
    await app.request(`/sessions/${id}/paid/answers/q1`, {
      method: "PUT",
      body: JSON.stringify({
        response: "More unclaimed attention for friends",
      }),
    });
    await app.request(`/sessions/${id}/paid/synthesize`, { method: "POST" });
    await processAIJob(dependencies);
    const draft = (await jobs.get(id, "synthesis"))?.result as {
      northStar: string;
      priority: string;
    };
    await app.request(`/sessions/${id}/paid/generate`, {
      method: "POST",
      body: JSON.stringify({
        alignment: "fits",
        northStar: draft.northStar,
        priority: draft.priority,
        feedback: "",
      }),
    });
    await processAIJob(dependencies);
    expect(attempts).toBe(2);
    expect(locales).toEqual(["de", "de"]);
    expect(answers["refinement:q1"]).toMatchObject({
      answer: "More unclaimed attention for friends",
    });
    const response = await app.request(`/sessions/${id}/compass`);
    expect(response.status).toBe(200);
    await app.request(`/sessions/${id}/paid/generate`, { method: "POST" });
    expect(await processAIJob(dependencies)).toBe(false);
    expect(attempts).toBe(2);
  });
});
