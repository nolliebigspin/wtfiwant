import { z } from "zod";
import type { StoredEvent } from "./store";

// This adapter deliberately sends no visitor IP, browser fingerprint or real URL.
// A short-lived, random tab ID joins the product funnel to verified purchases.
const transportAgent =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
export const umamiConfigSchema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)))
    );
  }),
  websiteId: z.uuid(),
  appUrl: z.url(),
});

export type UmamiConfig = z.infer<typeof umamiConfigSchema>;
export interface AnalyticsDestination {
  send(event: StoredEvent): Promise<void>;
}

export function umamiPayload(event: StoredEvent, config: UmamiConfig) {
  const url = new URL(
    `/${event.locale}${event.page === "landing" ? "" : `/${event.page}`}`,
    config.appUrl,
  );
  for (const [key, value] of Object.entries(event.attribution))
    url.searchParams.set(`utm_${key}`, value);
  const question = event.step === undefined ? undefined : event.step + 1;
  const name =
    event.name === "step_view" || event.name === "answer_saved"
      ? `question_${String(question).padStart(2, "0")}_${event.name === "step_view" ? "viewed" : "answered"}`
      : event.name;
  return {
    type: "event",
    payload: {
      website: config.websiteId,
      hostname: url.hostname,
      url: url.pathname + url.search,
      title: `wtfiwant · ${event.page}`,
      language: event.locale,
      referrer: "",
      id: event.visitId,
      ip: "127.0.0.1",
      userAgent: transportAgent,
      browser: "unknown",
      os: "unknown",
      device: "unknown",
      timestamp: Math.floor(Date.parse(event.createdAt) / 1000),
      ...(event.name === "page_view"
        ? {}
        : {
            name,
            data: {
              locale: event.locale,
              ...(question === undefined ? {} : { question }),
              ...event.attribution,
              ...(event.name === "purchase" &&
              event.amountCents !== undefined &&
              event.currency
                ? {
                    revenue: event.amountCents / 100,
                    currency: event.currency.toUpperCase(),
                  }
                : {}),
            },
          }),
    },
  };
}

export class UmamiDestination implements AnalyticsDestination {
  constructor(
    private readonly config: UmamiConfig,
    private readonly request: typeof fetch = fetch,
  ) {}

  async send(event: StoredEvent) {
    const response = await this.request(
      `${this.config.url.replace(/\/$/, "")}/api/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": transportAgent,
        },
        body: JSON.stringify(umamiPayload(event, this.config)),
        signal: AbortSignal.timeout(1500),
        redirect: "error",
      },
    );
    // Umami can return 200 for rejected bots. Require an actual saved event.
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.sessionId !== "string")
      throw new Error("Umami delivery unavailable");
  }
}
