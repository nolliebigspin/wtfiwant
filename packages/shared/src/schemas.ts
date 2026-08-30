import { z } from "zod";
import { localeSchema } from "./localization";

export const sessionIdSchema = z.uuid();
export const followUpIdSchema = z.uuid();
export const questionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9_.:-]+$/);
export const generatedFollowUpSchema = z.string().trim().min(5).max(300);
export const COACH_PROMPT_VERSION = "v1-chapter-evidence" as const;
export const generatedCoachPromptSchema = z
  .object({
    question: z.string().trim().min(5).max(300),
    evidenceQuestionIds: z.array(questionIdSchema).min(1).max(3),
    promptVersion: z.literal(COACH_PROMPT_VERSION),
  })
  .strict();
export const entitlementSchema = z.enum(["assessment", "full_analysis"]);
export const seedPersonaSchema = z.enum([
  "burned_out",
  "freedom_relationships",
  "stable_adventure",
]);

export const chapterIdSchema = z.enum([
  "you",
  "alive",
  "noise",
  "possibilities",
  "tradeoffs",
  "anti-life",
  "goals",
]);

export const sessionStatusSchema = z.enum([
  "in_progress",
  "completed",
  "safety_paused",
]);

export const sessionSchema = z
  .object({
    id: sessionIdSchema,
    status: sessionStatusSchema,
    currentChapter: chapterIdSchema,
    currentQuestionId: z.string().min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();

export const answerValueSchema = z.json();

export const answerSchema = z
  .object({
    questionId: z.string().min(1),
    value: answerValueSchema,
    updatedAt: z.iso.datetime(),
  })
  .strict();

const evidenceIdsSchema = z.array(z.string().min(1)).min(1);

export const analysisSchema = z
  .object({
    summary: z.string().min(1),
    coreDrivers: z
      .array(
        z
          .object({
            id: z.string().min(1),
            name: z.string().min(1),
            explanation: z.string().min(1),
            evidenceQuestionIds: evidenceIdsSchema,
            confidence: z.enum(["low", "medium", "high"]),
          })
          .strict(),
      )
      .min(3)
      .max(6),
    tensions: z
      .array(
        z
          .object({
            id: z.string().min(1),
            sideA: z.string().min(1),
            sideB: z.string().min(1),
            explanation: z.string().min(1),
            evidenceQuestionIds: evidenceIdsSchema,
          })
          .strict(),
      )
      .max(4),
    externalInfluences: z.array(
      z
        .object({
          observation: z.string().min(1),
          evidenceQuestionIds: evidenceIdsSchema,
        })
        .strict(),
    ),
    antiLife: z
      .object({
        themes: z.array(z.string().min(1)).min(1),
        summary: z.string().min(1),
        evidenceQuestionIds: evidenceIdsSchema,
      })
      .strict(),
    possibleDirections: z
      .array(
        z
          .object({
            title: z.string().min(1),
            explanation: z.string().min(1),
            whyItFits: z.string().min(1),
            evidenceQuestionIds: evidenceIdsSchema,
          })
          .strict(),
      )
      .min(2)
      .max(4),
    goals: z.array(
      z
        .object({
          originalGoal: z.string().min(1),
          possibleUnderlyingNeed: z.string().min(1),
          interpretation: z.string().min(1),
          evidenceQuestionIds: evidenceIdsSchema,
        })
        .strict(),
    ),
    firstSteps: z
      .array(
        z
          .object({
            direction: z.string().min(1),
            experiment: z.string().min(1),
            immediateAction: z.string().min(1),
            evidenceQuestionIds: evidenceIdsSchema,
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict();

export const storedAnalysisSchema = z
  .object({
    version: z.string().min(1),
    model: z.string().min(1),
    locale: localeSchema.default("en"),
    result: analysisSchema,
    createdAt: z.iso.datetime(),
  })
  .strict();

export const analysisPreviewSchema = z
  .object({
    locale: localeSchema,
    summary: analysisSchema.shape.summary,
    coreDriver: analysisSchema.shape.coreDrivers.element,
    lockedSections: z.array(
      z.enum([
        "drivers",
        "tensions",
        "anti_life",
        "influences",
        "directions",
        "goals",
        "action_plan",
      ]),
    ),
  })
  .strict();

export const followUpSchema = z
  .object({
    id: followUpIdSchema,
    questionId: questionIdSchema,
    generatedQuestion: generatedFollowUpSchema,
    locale: localeSchema.default("en"),
    userResponse: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const coachPromptSchema = z
  .object({
    id: followUpIdSchema,
    chapter: chapterIdSchema,
    question: generatedCoachPromptSchema.shape.question,
    evidenceQuestionIds: generatedCoachPromptSchema.shape.evidenceQuestionIds,
    promptVersion: z.literal(COACH_PROMPT_VERSION),
    locale: localeSchema.default("en"),
    userResponse: z.string().nullable(),
    resolvedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const actionPlanInputSchema = z
  .object({
    direction: z.string().trim().min(1).max(500),
    experiment: z.string().trim().min(1).max(1000),
    immediateAction: z.string().trim().min(1).max(500),
    obstacle: z.string().trim().min(1).max(500),
    ifCondition: z.string().trim().min(1).max(500),
    thenAction: z.string().trim().min(1).max(500),
  })
  .strict();

export const actionPlanSchema = actionPlanInputSchema.extend({
  updatedAt: z.iso.datetime(),
});

export const sessionViewSchema = z
  .object({
    session: sessionSchema,
    answers: z.record(z.string(), answerValueSchema),
    followUps: z.array(followUpSchema),
    coachPrompts: z.array(coachPromptSchema),
    preview: analysisPreviewSchema.nullable(),
    actionPlan: actionPlanSchema.nullable(),
    entitlements: z.array(entitlementSchema),
    checkoutAvailable: z.boolean(),
    legalLinks: z
      .object({ termsUrl: z.url(), refundPolicyUrl: z.url() })
      .strict()
      .nullable(),
  })
  .strict();

export const updateSessionInputSchema = z
  .object({
    currentChapter: chapterIdSchema,
    currentQuestionId: z.string().min(1),
  })
  .strict();

export const saveAnswerInputSchema = z
  .object({ value: answerValueSchema })
  .strict();

export const followUpInputSchema = z
  .object({
    questionId: questionIdSchema,
    locale: localeSchema.default("en"),
  })
  .strict();

export const coachPromptInputSchema = z
  .object({
    chapter: chapterIdSchema,
    locale: localeSchema.default("en"),
  })
  .strict();

export const coachPromptResponseInputSchema = z
  .object({ response: z.string().trim().min(1).max(5000).nullable() })
  .strict();

export const analysisInputSchema = z
  .object({ locale: localeSchema.default("en") })
  .strict();

export const checkoutInputSchema = z
  .object({ locale: localeSchema.default("en") })
  .strict();

export const checkoutSessionIdSchema = z
  .string()
  .trim()
  .min(6)
  .max(255)
  .regex(/^cs_[A-Za-z0-9_-]+$/);

export const paymentEventSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(6)
      .max(255)
      .regex(/^evt_[A-Za-z0-9_-]+$/),
    type: z.enum([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ]),
    checkoutSessionId: checkoutSessionIdSchema,
  })
  .strict();

export const checkoutResponseSchema = z.union([
  z
    .object({
      status: z.literal("checkout_open"),
      checkoutSessionId: z.string().min(1),
      url: z.url(),
    })
    .strict(),
  z.object({ status: z.literal("paid") }).strict(),
]);

export const compassResponseSchema = z
  .object({
    analysis: storedAnalysisSchema,
    actionPlan: actionPlanSchema.nullable(),
  })
  .strict();

export const coachPromptResponseSchema = z
  .object({ coachPrompt: coachPromptSchema })
  .strict();

export const fulfillmentResponseSchema = z
  .object({ status: z.enum(["paid", "processing", "failed"]) })
  .strict();

export const webhookResponseSchema = z
  .object({ received: z.literal(true) })
  .strict();

export const followUpResponseInputSchema = z
  .object({ response: z.string().trim().min(1).max(5000) })
  .strict();

export const safetyResponseSchema = z
  .object({
    status: z.literal("safety_paused"),
    message: z.string().min(1),
  })
  .strict();

export const analysisResponseSchema = z.union([
  z
    .object({ status: z.literal("complete"), analysis: storedAnalysisSchema })
    .strict(),
  z
    .object({
      status: z.literal("preview_ready"),
      preview: analysisPreviewSchema,
    })
    .strict(),
  safetyResponseSchema,
]);

export const apiErrorSchema = z
  .object({
    error: z.string().min(1),
    details: z.array(z.string()).optional(),
  })
  .strict();

export type ChapterId = z.infer<typeof chapterIdSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionView = z.infer<typeof sessionViewSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;
export type AnalysisPreview = z.infer<typeof analysisPreviewSchema>;
export type ActionPlanInput = z.infer<typeof actionPlanInputSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type Entitlement = z.infer<typeof entitlementSchema>;
export type SeedPersona = z.infer<typeof seedPersonaSchema>;
export type CoachPrompt = z.infer<typeof coachPromptSchema>;
export type GeneratedCoachPrompt = z.infer<typeof generatedCoachPromptSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
export type CompassResponse = z.infer<typeof compassResponseSchema>;
export type FulfillmentStatus = z.infer<
  typeof fulfillmentResponseSchema
>["status"];
export type PaymentEvent = z.infer<typeof paymentEventSchema>;
