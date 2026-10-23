import { z } from "zod";
import { isAnswerComplete, tradeoffAnswerSchema } from "./answers";
import { assessmentQuestions, tradeoffPairs } from "./assessment";
import { directionDraftSchema, directionReviewSchema } from "./compass";
import { formatReportAnswer, reflectionQuestionLabel } from "./format-answer";
import {
  getGermanAssessmentTranslation,
  type Locale,
  localeSchema,
} from "./localization";

export const JOURNEY_VERSION = "v4-confirmed-compass";

/** Stable persisted question IDs; only the path changes with the answers. */
export function freeJourney(answers: Record<string, unknown>) {
  const desire = answers["noise.private_desire"];
  const branch =
    desire === "Definitely" || desire === "Probably"
      ? "life.drifted"
      : "noise.supposed";
  return [
    "life.energy",
    "life.chosen",
    "alive.memories",
    "noise.working_toward",
    "noise.private_desire",
    branch,
    "tradeoffs.choices",
  ].map((id) => {
    const question = assessmentQuestions.find((item) => item.id === id);
    if (!question) throw new Error("Unknown journey question");
    return question;
  });
}

export function missingFreeAnswers(answers: Record<string, unknown>) {
  return freeJourney(answers)
    .filter((question) => !isAnswerComplete(question, answers[question.id]))
    .map((question) => question.id);
}

export function freeQuestionContext(
  id: string,
  answers: Record<string, unknown>,
  locale: Locale,
) {
  const de = locale === "de";
  if (
    id === "noise.private_desire" &&
    typeof answers["noise.working_toward"] === "string"
  )
    return `${de ? "Dein aktuelles Ziel" : "Your current goal"}: ${String(answers["noise.working_toward"]).slice(0, 400)}`;
  if (id === "noise.supposed")
    return de
      ? "Du bist dir nicht sicher, ob du dieses Ziel nur für dich willst. Schauen wir auf die Erwartungen dahinter."
      : "You are unsure whether you want this goal for yourself. Let’s look at the expectations behind it.";
  if (id === "life.drifted")
    return de
      ? "Du würdest dein Ziel auch ohne Anerkennung verfolgen. Was in deinem Alltag fühlt sich dagegen nicht selbst gewählt an?"
      : "You would pursue your goal without recognition. What in your everyday life feels less deliberately chosen?";
  return null;
}

export const checkpointSchema = z
  .object({
    locale: localeSchema,
    cards: z.array(
      z
        .object({ id: z.string(), title: z.string(), answer: z.string() })
        .strict(),
    ),
    tradeoffs: z.array(
      z
        .object({
          left: z.string(),
          right: z.string(),
          value: z.number().int().min(-2).max(2),
        })
        .strict(),
    ),
    reflectionPrompt: z.string(),
  })
  .strict();
export type Checkpoint = z.infer<typeof checkpointSchema>;

/** A mirror of explicit answers, never an AI diagnosis or inferred score. */
export function buildCheckpoint(
  answers: Record<string, unknown>,
  locale: Locale,
): Checkpoint {
  const de = locale === "de";
  const pairs = de
    ? getGermanAssessmentTranslation().tradeoffPairs
    : tradeoffPairs;
  const parsed = tradeoffAnswerSchema.safeParse(answers["tradeoffs.choices"]);
  return checkpointSchema.parse({
    locale,
    cards: [
      "life.energy",
      "life.chosen",
      "alive.memories",
      "noise.working_toward",
      "noise.private_desire",
      freeJourney(answers)[5].id,
    ].flatMap((id) =>
      answers[id] === undefined
        ? []
        : [
            {
              id,
              title: reflectionQuestionLabel(id, locale),
              answer: formatReportAnswer(id, answers[id], locale),
            },
          ],
    ),
    tradeoffs: parsed.success
      ? pairs.map(([left, right], index) => ({
          left,
          right,
          value: parsed.data.choices[index],
        }))
      : [],
    reflectionPrompt:
      answers["noise.private_desire"] === "Definitely" ||
      answers["noise.private_desire"] === "Probably"
        ? de
          ? "Welche kleine Veränderung würde deinem selbst gewählten Ziel diese Woche mehr Raum geben?"
          : "What small change would give your chosen goal more room this week?"
        : de
          ? "Welche Erwartung würdest du für eine Woche loslassen, wenn niemand davon erfahren würde?"
          : "Which expectation would you set aside for a week if nobody would know?",
  });
}

export const refinementPlanSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            id: z.enum(["q1", "q2", "q3", "q4", "q5"]),
            question: z.string().trim().min(10).max(400),
            evidenceQuestionIds: z.array(z.string()).min(1).max(3),
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict()
  .refine(
    (plan) =>
      new Set(plan.questions.map((q) => q.id)).size === plan.questions.length,
    "Duplicate question IDs",
  );
export type RefinementPlan = z.infer<typeof refinementPlanSchema>;
export const refinementAnswerSchema = z
  .object({ response: z.string().trim().min(1).max(5000).nullable() })
  .strict();
export const paidJourneySchema = z
  .object({
    locale: localeSchema,
    stage: z.enum([
      "planning",
      "refining",
      "synthesizing",
      "reviewing",
      "generating",
      "ready",
      "failed",
      "safety_paused",
    ]),
    questions: z
      .array(
        z
          .object({
            id: z.enum(["q1", "q2", "q3", "q4", "q5"]),
            question: z.string(),
            evidenceQuestionIds: z.array(z.string()),
          })
          .strict(),
      )
      .max(5),
    draft: directionDraftSchema.nullable().optional(),
    review: directionReviewSchema.nullable().optional(),
    responses: z.record(z.string(), z.string().nullable()),
    canSkip: z.boolean(),
    purchaseConfirmationPending: z.boolean().optional(),
    delivery: z.enum(["pending", "sent", "failed"]),
  })
  .strict();
export type PaidJourney = z.infer<typeof paidJourneySchema>;
export const purchaseOfferSchema = z
  .object({
    amount: z.number().int().positive(),
    currency: z.string().regex(/^[a-z]{3}$/),
    taxIncluded: z.boolean(),
  })
  .strict();
export type PurchaseOffer = z.infer<typeof purchaseOfferSchema>;
