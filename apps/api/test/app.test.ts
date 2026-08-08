import { describe, expect, test } from "bun:test";
import { sessionViewSchema } from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import { createApp } from "../src/app";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

describe("assessment API", () => {
  test("creates an anonymous session ready at the first question", async () => {
    const app = createApp({ repository: new InMemoryAssessmentRepository() });

    const response = await app.request("/sessions", { method: "POST" });
    const body = sessionViewSchema.parse(await response.json());

    expect(response.status).toBe(201);
    expect(body.session.status).toBe("in_progress");
    expect(body.session.currentQuestionId).toBe("life.energy");
    expect(body.answers).toEqual({});
    expect(body.entitlements).toEqual(["assessment", "full_analysis"]);
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
    const followUp = await app.request(
      `/sessions/${created.session.id}/follow-up`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: "life.chosen" }),
      },
    );

    const response = await app.request(
      `/sessions/${created.session.id}/analyze`,
      {
        method: "POST",
      },
    );
    const body = (await response.json()) as { status: string; message: string };

    expect(followUp.status).toBe(409);
    expect(response.status).toBe(200);
    expect(body.status).toBe("safety_paused");
    expect(body.message).toContain("immediate danger");
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
