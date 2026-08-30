import { describe, expect, test } from "bun:test";
import {
  COACH_PROMPT_VERSION,
  coachPromptSchema,
  sessionViewSchema,
} from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import { createApp } from "../src/app";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

describe("assessment API", () => {
  test("offers one evidence-linked Coach Prompt for a completed chapter", async () => {
    const repository = new InMemoryAssessmentRepository();
    const app = createApp({
      repository,
      aiProvider: {
        name: "coach-test",
        async generateCoachPrompt(answers) {
          expect(Object.keys(answers)).toEqual([
            "life.energy",
            "life.chosen",
            "life.drifted",
          ]);
          return {
            question: "Which part of that drift costs you the most energy?",
            evidenceQuestionIds: ["life.drifted"],
            promptVersion: COACH_PROMPT_VERSION,
          };
        },
        async generateFollowUp() {
          throw new Error("not used");
        },
        async analyzeAssessment() {
          throw new Error("not used");
        },
      },
    });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );
    for (const [questionId, value] of [
      ["life.energy", ["Work"]],
      ["life.chosen", "I chose the people around me."],
      ["life.drifted", "My calendar filled itself."],
    ] as const) {
      await app.request(
        `/sessions/${created.session.id}/answers/${questionId}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value }),
        },
      );
    }
    await app.request(`/sessions/${created.session.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentChapter: "you",
        currentQuestionId: "life.drifted",
      }),
    });

    const response = await app.request(
      `/sessions/${created.session.id}/coach-prompt`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapter: "you", locale: "en" }),
      },
    );
    const body = (await response.json()) as { coachPrompt: unknown };
    const prompt = coachPromptSchema.parse(body.coachPrompt);

    expect(response.status).toBe(201);
    expect(prompt.question).toContain("drift");
    expect(prompt.evidenceQuestionIds).toEqual(["life.drifted"]);
    expect(prompt.promptVersion).toBe(COACH_PROMPT_VERSION);
  });

  test("rejects a Coach Prompt before the current chapter is complete", async () => {
    const repository = new InMemoryAssessmentRepository();
    const app = createApp({ repository });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );
    await app.request(`/sessions/${created.session.id}/answers/life.energy`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: ["Work"] }),
    });

    const response = await app.request(
      `/sessions/${created.session.id}/coach-prompt`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapter: "you", locale: "en" }),
      },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Current chapter is incomplete",
    });
  });

  test("creates an anonymous session ready at the first question", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });

    const response = await app.request("/sessions", { method: "POST" });
    const body = sessionViewSchema.parse(await response.json());

    expect(response.status).toBe(201);
    expect(body.session.status).toBe("in_progress");
    expect(body.session.currentQuestionId).toBe("life.energy");
    expect(body.answers).toEqual({});
    expect(body.entitlements).toEqual(["assessment"]);
    expect(body.checkoutAvailable).toBe(false);
  });

  test("returns only a Compass Preview until the Full Compass is entitled", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });
    const seededResponse = await app.request("/dev/seed/burned_out", {
      method: "POST",
    });
    const seeded = sessionViewSchema.parse(await seededResponse.json());

    expect(seeded.preview?.summary).toBeTruthy();
    expect(seeded.preview?.coreDriver.name).toBeTruthy();
    expect("analysis" in seeded).toBe(false);

    const full = await app.request(`/sessions/${seeded.session.id}/compass`);
    expect(full.status).toBe(402);
    expect(await full.json()).toEqual({
      error: "Full Compass requires payment",
    });
  });

  test("validates and persists an answer through the session interface", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );

    const invalid = await app.request(
      `/sessions/${created.session.id}/answers/life.chosen`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "" }),
      },
    );
    expect(invalid.status).toBe(400);

    const saved = await app.request(
      `/sessions/${created.session.id}/answers/life.chosen`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          value: "I chose to make things with people I respect.",
        }),
      },
    );
    expect(saved.status).toBe(200);

    const restored = sessionViewSchema.parse(
      await (await app.request(`/sessions/${created.session.id}`)).json(),
    );
    expect(restored.answers["life.chosen"]).toBe(
      "I chose to make things with people I respect.",
    );
  });

  test("pauses normal analysis when an answer indicates immediate self-harm danger", async () => {
    const app = createApp({
      repository: new InMemoryAssessmentRepository(),
      aiProvider: new LocalAIProvider(),
    });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );
    await app.request(`/sessions/${created.session.id}/answers/life.chosen`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "I plan to end my life today" }),
    });
    const response = await app.request(
      `/sessions/${created.session.id}/analyze`,
      {
        method: "POST",
      },
    );
    const body = (await response.json()) as { status: string; message: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("safety_paused");
    expect(body.message).toContain("immediate danger");
  });

  test("never returns a cached Compass after a new answer pauses the Reflection", async () => {
    const repository = new InMemoryAssessmentRepository();
    const app = createApp({ repository });
    const seeded = sessionViewSchema.parse(
      await (
        await app.request("/dev/seed/burned_out", { method: "POST" })
      ).json(),
    );
    await repository.saveAnswer(
      seeded.session.id,
      "life.chosen",
      "I plan to end my life today",
    );

    const response = await app.request(
      `/sessions/${seeded.session.id}/analyze`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      },
    );

    expect(response.status).toBe(200);
    expect((await response.json()) as { status: string }).toMatchObject({
      status: "safety_paused",
    });
    const restored = sessionViewSchema.parse(
      await (await app.request(`/sessions/${seeded.session.id}`)).json(),
    );
    expect(restored.preview).toBeNull();
  });

  test("deletes a reflection and every child resource behind it", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );
    await app.request(`/sessions/${created.session.id}/answers/life.chosen`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "A private answer" }),
    });

    const deleted = await app.request(`/sessions/${created.session.id}`, {
      method: "DELETE",
    });
    const missing = await app.request(`/sessions/${created.session.id}`);

    expect(deleted.status).toBe(204);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Reflection not found" });
  });

  test("rejects malformed resource identifiers before repository work", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });

    const response = await app.request("/sessions/not-a-uuid");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid reflection ID" });
  });
});
