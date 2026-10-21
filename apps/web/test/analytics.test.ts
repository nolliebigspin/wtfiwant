import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  analyticsConsent,
  analyticsContext,
  chooseAnalytics,
  configureAnalytics,
  trackAnalytics,
} from "../src/lib/analytics";

const originalFetch = globalThis.fetch;
const keys = [
  "wtfiwant.analytics-consent.v2",
  "wtfiwant.analytics-visit.v2",
  "wtfiwant.analytics-milestones.v2",
];
afterEach(() => {
  configureAnalytics(false);
  for (const key of keys) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  globalThis.fetch = originalFetch;
});

describe("analytics browser consent boundary", () => {
  test("sends nothing before consent or after refusal, then deduplicates allowed milestones", async () => {
    const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
    globalThis.fetch = Object.assign(
      mock(async (url: string | URL | Request, init?: RequestInit) => {
        requests.push({
          url: String(url),
          body: JSON.parse(String(init?.body)),
        });
        return new Response(null, { status: 204 });
      }),
      { preconnect() {} },
    );
    configureAnalytics(true);
    trackAnalytics("step_view", "reflection", "de", 0);
    expect(requests).toHaveLength(0);
    await chooseAnalytics("declined");
    trackAnalytics("step_view", "reflection", "de", 0);
    expect(requests).toHaveLength(0);
    await chooseAnalytics("accepted");
    trackAnalytics("step_view", "reflection", "de", 0);
    trackAnalytics("step_view", "reflection", "de", 0);
    expect(requests).toHaveLength(1);
    expect(requests[0].body.name).toBe("step_view");
    expect(requests[0].body).not.toHaveProperty("url");
    expect(requests[0].body).not.toHaveProperty("answers");
    const visit = analyticsContext();
    await chooseAnalytics("declined");
    expect(requests.at(-1)?.url).toBe("/api/analytics/forget");
    expect(requests.at(-1)?.body).toEqual({ visitId: visit?.visitId });
    expect(sessionStorage.getItem(keys[1])).toBeNull();
    expect(analyticsConsent()).toBe("declined");
    trackAnalytics("preview_viewed", "result", "de");
    expect(requests).toHaveLength(2);
  });
  test("an expired visit receives a fresh random analytics identifier", async () => {
    configureAnalytics(true);
    await chooseAnalytics("accepted");
    const before = analyticsContext();
    sessionStorage.setItem(
      keys[1],
      JSON.stringify({ ...before, expires: Date.now() - 1 }),
    );
    expect(analyticsContext()?.visitId).not.toBe(before?.visitId);
  });
});
