import { z } from "zod";

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
    id: z.uuid(),
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
      .min(1)
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
    result: analysisSchema,
    createdAt: z.iso.datetime(),
  })
  .strict();

export const followUpSchema = z
  .object({
    id: z.uuid(),
    questionId: z.string().min(1),
    generatedQuestion: z.string().min(1),
    userResponse: z.string().nullable(),
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
    analysis: storedAnalysisSchema.nullable(),
    actionPlan: actionPlanSchema.nullable(),
    entitlements: z.array(z.enum(["assessment", "full_analysis"])),
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
    questionId: z.string().min(1),
    answer: z.string().trim().min(1).max(5000),
  })
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
export type ActionPlanInput = z.infer<typeof actionPlanInputSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
