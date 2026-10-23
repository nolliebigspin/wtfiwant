import { describe, expect, test } from "bun:test";
import { sessionViewSchema } from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import { createApp } from "../src/app";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

describe("assessment API", () => {
  test("protects private responses and errors from caches and indexing at either mount path", async () => {
    for (const basePath of ["/", "/api"]) {
      const app = createApp({
        repository: new InMemoryAssessmentRepository(),
        basePath,
      });
      const prefix = basePath === "/" ? "" : basePath;
      const created = await app.request(`${prefix}/sessions`, {
        method: "POST",
      });
      const { session } = await created.json();
      const responses = [
        created,
        await app.request(`${prefix}/sessions/${session.id}`),
        await app.request(`${prefix}/sessions/${session.id}/paid`),
        await app.request(`${prefix}/sessions/${crypto.randomUUID()}`),
        await app.request(`${prefix}/withdrawals`, {
          method: "POST",
          body: "{}",
        }),
      ];
      expect(responses.map((response) => response.status)).toEqual([
        201, 200, 402, 404, 400,
      ]);
      for (const response of responses) {
        expect(response.headers.get("Cache-Control")).toBe("private, no-store");
        expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
        expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      }
    }
  });

  test("rejects AI coaching before payment", async () => {
    const repository = new InMemoryAssessmentRepository();
    const app = createApp({
      repository,
      aiProvider: {
        ...new LocalAIProvider(),
        name: "no-unpaid-ai",
        async generateCoachPrompt() {
          throw new Error("Unpaid AI call");
        },
        async generateFollowUp() {
          throw new Error("Unpaid AI call");
        },
        async analyzeAssessment() {
          throw new Error("Unpaid AI call");
        },
      },
    });
    const record = await repository.createSession();
    const response = await app.request(
      `/sessions/${record.session.id}/coach-prompt`,
      { method: "POST", body: JSON.stringify({ chapter: "you" }) },
    );
    expect(response.status).toBe(402);
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

    expect(seeded.preview).toBeNull();
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
