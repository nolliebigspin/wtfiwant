import { z } from "zod";
import { localeSchema } from "./localization";

export function isLocalAnalyticsHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host === "[::1]" ||
    host === "0.0.0.0" ||
    /^127\./.test(host)
  );
}

export const analyticsConfigSchema = z
  .object({ enabled: z.boolean() })
  .strict();

// Finite dimensions: never accept arbitrary URLs, titles, properties or answers.
export const analyticsPageSchema = z.enum([
  "landing",
  "commitment",
  "reflection",
  "result",
  "terms",
  "refunds",
  "withdraw",
  "privacy",
]);
export const analyticsAttributionSchema = z
  .object({
    source: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
    medium: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
    campaign: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
    content: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
  })
  .strict();
export const analyticsContextSchema = z
  .object({
    visitId: z.uuid(),
    attribution: analyticsAttributionSchema,
  })
  .strict();
export const analyticsEventSchema = analyticsContextSchema
  .extend({
    id: z.uuid(),
    name: z.enum([
      "page_view",
      "step_view",
      "answer_saved",
      "preview_viewed",
      "checkpoint_viewed",
      "paid_refinement_viewed",
      "paid_refinement_answered",
      "direction_review_viewed",
      "direction_review_saved",
      "generation_started",
      "report_ready",
      "report_viewed",
      "pdf_download",
      "journey_error",
      "checkout_error",
      "reflection_started",
      "reflection_completed",
      "checkout_clicked",
      "checkout_cancelled",
      "action_plan_saved",
      "report_error",
    ]),
    page: analyticsPageSchema,
    locale: localeSchema,
    step: z.number().int().min(0).max(14).optional(),
  })
  .strict()
  .refine(
    (value) =>
      !["step_view", "answer_saved"].includes(value.name) ||
      (value.step !== undefined && value.page === "reflection"),
    { message: "Question events need a step" },
  );
export const analyticsForgetSchema = z.object({ visitId: z.uuid() }).strict();
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsContext = z.infer<typeof analyticsContextSchema>;
export type AnalyticsAttribution = z.infer<typeof analyticsAttributionSchema>;
