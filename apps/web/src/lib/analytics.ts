import {
  type AnalyticsAttribution,
  type AnalyticsContext,
  type AnalyticsEvent,
  analyticsAttributionSchema,
  analyticsContextSchema,
} from "@wtfiwant/shared";

const consentKey = "wtfiwant.analytics-consent.v2";
const visitKey = "wtfiwant.analytics-visit.v2";
const milestonesKey = "wtfiwant.analytics-milestones.v2";
let enabled = false;
let firstTouch: AnalyticsAttribution = {};
const sent = new Set<string>();
export type AnalyticsConsent = "accepted" | "declined" | null;

export function analyticsConsent(): AnalyticsConsent {
  try {
    const stored = JSON.parse(localStorage.getItem(consentKey) ?? "null");
    if (
      stored?.expires > Date.now() &&
      ["accepted", "declined"].includes(stored.value)
    )
      return stored.value;
  } catch {
    /* Storage is optional. */
  }
  return null;
}
export function privacySignal(): boolean {
  return (
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  );
}
export function configureAnalytics(active: boolean) {
  enabled = active;
  if (!active) {
    firstTouch = {};
    sent.clear();
  }
  const params = new URLSearchParams(window.location.search);
  const candidate = Object.fromEntries(
    ["source", "medium", "campaign", "content"].flatMap((key) => {
      const value = params.get(`utm_${key}`);
      return value &&
        /^[a-zA-Z0-9_-]{1,64}$/.test(value) &&
        !/^[a-f0-9-]{32,36}$/i.test(value)
        ? [[key, value.toLowerCase()]]
        : [];
    }),
  );
  if (Object.keys(firstTouch).length === 0)
    firstTouch = analyticsAttributionSchema.parse(candidate);
  window.dispatchEvent(new Event("wtfiwant:analytics"));
}
function send(path: string, body: unknown): Promise<Response> {
  return fetch(`/api/analytics/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
  });
}
export function analyticsContext(): AnalyticsContext | undefined {
  if (!enabled || privacySignal() || analyticsConsent() !== "accepted")
    return undefined;
  try {
    const visit = JSON.parse(sessionStorage.getItem(visitKey) ?? "null");
    if (visit?.expires > Date.now() && typeof visit.visitId === "string") {
      visit.expires = Date.now() + 30 * 60_000;
      sessionStorage.setItem(visitKey, JSON.stringify(visit));
      return analyticsContextSchema.parse({
        visitId: visit.visitId,
        attribution: visit.attribution,
      });
    }
    const context = { visitId: crypto.randomUUID(), attribution: firstTouch };
    sessionStorage.removeItem(milestonesKey);
    sessionStorage.setItem(
      visitKey,
      JSON.stringify({ ...context, expires: Date.now() + 30 * 60_000 }),
    );
    return context;
  } catch {
    return undefined;
  }
}
export async function chooseAnalytics(
  value: Exclude<AnalyticsConsent, null>,
): Promise<void> {
  // Commit the refusal locally first, so in-flight actions stop immediately.
  try {
    localStorage.setItem(
      consentKey,
      JSON.stringify({ value, expires: Date.now() + 180 * 86400_000 }),
    );
  } catch {
    /* No tracking without a remembered choice. */
  }
  if (value === "declined") {
    try {
      const visit = JSON.parse(sessionStorage.getItem(visitKey) ?? "null");
      if (visit?.visitId) {
        const response = await send("forget", { visitId: visit.visitId });
        if (!response.ok) throw new Error("Analytics deletion unavailable");
      }
      sessionStorage.removeItem(visitKey);
      sessionStorage.removeItem(milestonesKey);
    } catch {
      throw new Error("Analytics deletion unavailable");
    }
  }
  sent.clear();
  window.dispatchEvent(new Event("wtfiwant:analytics"));
}
export function trackAnalytics(
  name: AnalyticsEvent["name"],
  page: AnalyticsEvent["page"],
  locale: AnalyticsEvent["locale"],
  step?: number,
) {
  const context = analyticsContext();
  if (!context) return;
  const key = `${context.visitId}:${name}:${page}:${locale}:${step ?? ""}`;
  // Page views count actual navigations; funnel milestones count once per visit.
  try {
    const remembered: string[] = JSON.parse(
      sessionStorage.getItem(milestonesKey) ?? "[]",
    );
    if (name !== "page_view" && (sent.has(key) || remembered.includes(key)))
      return;
  } catch {
    /* Session storage is optional. */
  }
  sent.add(key);
  void send("events", {
    ...context,
    id: crypto.randomUUID(),
    name,
    page,
    locale,
    ...(step === undefined ? {} : { step }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Analytics unavailable");
      if (name === "page_view") return;
      try {
        // Do not restore visit storage after a refusal while this request was pending.
        if (
          analyticsConsent() !== "accepted" ||
          analyticsContext()?.visitId !== context.visitId
        )
          return;
        const remembered: string[] = JSON.parse(
          sessionStorage.getItem(milestonesKey) ?? "[]",
        );
        sessionStorage.setItem(
          milestonesKey,
          JSON.stringify([...new Set([...remembered, key])].slice(-150)),
        );
      } catch {
        /* Session storage is optional. */
      }
    })
    .catch(() => {
      sent.delete(key);
    });
}
