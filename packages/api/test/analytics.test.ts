import { describe, expect, test } from "bun:test";
import { isLocalAnalyticsHost } from "@wtfiwant/shared";
import { createAnalytics } from "../src/analytics/config";
import { InMemoryAnalyticsStore } from "../src/analytics/in-memory";
import { UmamiDestination, umamiPayload } from "../src/analytics/umami";
import { createApp } from "../src/app";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

const visitId = crypto.randomUUID();
const sample = {
  id: crypto.randomUUID(),
  visitId,
  name: "step_view" as const,
  page: "reflection" as const,
  locale: "de" as const,
  step: 2,
  attribution: {
    source: "meta",
    medium: "paid_social",
    campaign: "launch_de",
    content: "ad_a",
  },
};
const headers = {
  "content-type": "application/json",
  origin: "https://wtfiwant.test",
};
function setup() {
  const analytics = new InMemoryAnalyticsStore();
  const app = createApp({
    repository: new InMemoryAssessmentRepository(),
    analytics,
    publicAppUrl: "https://wtfiwant.test",
  });
  return { app, analytics };
}

describe("self-hosted analytics public seam", () => {
  test("accepts finite dimensions, deduplicates events and exposes no reporting dashboard", async () => {
    const { app, analytics } = setup();
    for (let index = 0; index < 2; index++)
      expect(
        (
          await app.request("/analytics/events", {
            method: "POST",
            headers,
            body: JSON.stringify(sample),
          })
        ).status,
      ).toBe(204);
    expect(analytics.rows).toHaveLength(1);
    // Charts and authentication now belong to Umami, not this app.
    expect((await app.request("/analytics/summary")).status).toBe(404);
  });
  test("rejects reflection content, private URLs, forged purchases and cross-site events", async () => {
    const { app } = setup();
    for (const extra of [
      { answers: "private" },
      { url: "/de/result/private" },
      { name: "purchase" },
      { step: 99 },
      { attribution: { campaign: "person@example.com" } },
    ]) {
      expect(
        (
          await app.request("/analytics/events", {
            method: "POST",
            headers,
            body: JSON.stringify({ ...sample, ...extra }),
          })
        ).status,
      ).toBe(400);
    }
    expect(
      (
        await app.request("/analytics/events", {
          method: "POST",
          headers: { ...headers, origin: "https://evil.test" },
          body: JSON.stringify(sample),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await app.request("/analytics/events", {
          method: "POST",
          headers,
          body: JSON.stringify({ ...sample, extra: "x".repeat(5000) }),
        })
      ).status,
    ).toBe(413);
  });
  test("withdrawal removes the visit and rejects late events and conversion callbacks", async () => {
    const { app, analytics } = setup();
    await analytics.record(sample);
    await analytics.checkout("private_checkout_id", sample, "de");
    expect(
      (
        await app.request("/analytics/forget", {
          method: "POST",
          headers,
          body: JSON.stringify({ visitId }),
        })
      ).status,
    ).toBe(204);
    await analytics.record({ ...sample, id: crypto.randomUUID() });
    await analytics.purchase("private_checkout_id", 1900, "eur");
    expect(analytics.rows).toHaveLength(0);
  });
  test("confirmed conversions are idempotent and preserve first-touch campaigns", async () => {
    const { analytics } = setup();
    await analytics.record(sample);
    await analytics.checkout("private_checkout_id", sample, "de");
    await analytics.checkout("private_checkout_id", sample, "de");
    await analytics.purchase("unknown", 1900, "eur");
    await analytics.purchase("private_checkout_id", 1900, "eur");
    await analytics.purchase("private_checkout_id", 1900, "eur");
    const purchases = analytics.rows.filter((row) => row.name === "purchase");
    expect(purchases).toHaveLength(1);
    expect(purchases[0].amountCents).toBe(1900);
    expect(purchases[0].attribution.campaign).toBe("launch_de");
  });
});

const config = {
  url: "https://analytics.awinter.dev",
  websiteId: "e676c9b4-11e4-4ef1-a4d7-87001773e9f2",
  appUrl: "https://wtfiwant.app",
};

describe("production-only analytics", () => {
  const env = {
    ...process.env,
    NODE_ENV: "production" as const,
    ANALYTICS_ENABLED: "true",
    ANALYTICS_HASH_SECRET: "test-independent-secret-at-least-32-characters",
    UMAMI_URL: config.url,
    UMAMI_WEBSITE_ID: config.websiteId,
    PUBLIC_APP_URL: config.appUrl,
  };
  test("never constructs a collector in development or on loopback hosts", () => {
    for (const mode of ["development", "test"] as const)
      expect(createAnalytics("unused", { ...env, NODE_ENV: mode })).toEqual({});
    for (const host of [
      "localhost",
      "preview.localhost",
      "127.0.0.1",
      "127.0.0.2",
      "[::1]",
      "0.0.0.0",
    ]) {
      expect(isLocalAnalyticsHost(host)).toBe(true);
      expect(
        createAnalytics("unused", {
          ...env,
          PUBLIC_APP_URL: `http://${host}:3000`,
        }),
      ).toEqual({});
    }
  });
  test("allows the explicitly enabled production website", async () => {
    const { analytics } = createAnalytics(
      "postgres://test:test@127.0.0.1:1/test",
      env,
    );
    expect(analytics).toBeDefined();
    expect(isLocalAnalyticsHost("wtfiwant.app")).toBe(false);
    await analytics?.close();
  });
});

describe("Umami destination", () => {
  test("normalizes pages and question events, excludes sensitive network metadata", () => {
    const event = { ...sample, createdAt: new Date().toISOString() };
    const result = umamiPayload(event, config);
    expect(result.payload.name).toBe("question_03_viewed");
    expect(result.payload.url).toBe(
      "/de/reflection?utm_source=meta&utm_medium=paid_social&utm_campaign=launch_de&utm_content=ad_a",
    );
    expect(result.payload.data?.question).toBe(3);
    expect(result.payload.ip).toBe("127.0.0.1");
    expect(result.payload.referrer).toBe("");
    expect(result.payload).not.toHaveProperty("screen");
    const pageview = umamiPayload(
      { ...event, name: "page_view", page: "result" },
      config,
    );
    expect(pageview.payload).not.toHaveProperty("name");
    expect(pageview.payload).not.toHaveProperty("data");
    expect(pageview.payload.url).toStartWith("/de/result?");
  });
  test("only verified purchase events include Umami revenue fields", () => {
    const base = { ...sample, createdAt: new Date().toISOString() };
    const payload = umamiPayload(
      { ...base, name: "purchase", amountCents: 1900, currency: "eur" },
      config,
    );
    expect(payload.payload.data).toMatchObject({
      revenue: 19,
      currency: "EUR",
      campaign: "launch_de",
    });
    expect(umamiPayload(base, config).payload.data).not.toHaveProperty(
      "revenue",
    );
  });
  test("failed sends remain pending and retries do not repeat acknowledged events", async () => {
    const attempts: string[] = [];
    let offline = true;
    const store = new InMemoryAnalyticsStore({
      send: async (event) => {
        if (offline) throw new Error("offline");
        attempts.push(event.id);
      },
    });
    await store.record(sample);
    await expect(store.flush()).rejects.toThrow("offline");
    offline = false;
    await store.flush();
    await store.flush();
    expect(attempts).toEqual([sample.id]);
  });
  test("uses Umami's HTTP API without forwarding request headers or credentials", async () => {
    let body: Record<string, unknown> | undefined;
    const request = Object.assign(
      async (url: string | URL | Request, init?: RequestInit) => {
        expect(String(url)).toBe("https://analytics.awinter.dev/api/send");
        expect(init?.headers).not.toHaveProperty("Authorization");
        expect(init?.headers).not.toHaveProperty("X-Forwarded-For");
        body = JSON.parse(String(init?.body));
        return Response.json({ sessionId: crypto.randomUUID() });
      },
      { preconnect() {} },
    );
    await new UmamiDestination(config, request).send({
      ...sample,
      createdAt: new Date().toISOString(),
    });
    expect(body?.type).toBe("event");
  });
  test("rejects bot acknowledgements and upstream failures", async () => {
    for (const response of [
      Response.json({ beep: "boop" }),
      new Response(null, { status: 503 }),
    ]) {
      const request = Object.assign(async () => response, { preconnect() {} });
      await expect(
        new UmamiDestination(config, request).send({
          ...sample,
          createdAt: new Date().toISOString(),
        }),
      ).rejects.toThrow();
    }
  });
});
