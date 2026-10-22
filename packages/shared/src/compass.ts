import { z } from "zod";

const text = z.string().trim().min(1).max(1200);
const evidence = z.array(z.string().min(1)).min(1).max(8);

/** A proposal to review, never a verdict about someone's identity. */
export const directionDraftSchema = z
  .object({
    northStar: text,
    priority: text,
    why: text,
    evidenceQuestionIds: evidence,
    uncertainty: text,
  })
  .strict();
export type DirectionDraft = z.infer<typeof directionDraftSchema>;

export const directionReviewSchema = z
  .object({
    alignment: z.enum(["fits", "adjusted", "unsure"]),
    northStar: z.string().trim().min(5).max(1200),
    priority: z.string().trim().min(5).max(1200),
    feedback: z.string().trim().max(2000),
  })
  .strict()
  .refine(
    (value) => value.alignment === "fits" || value.feedback.length >= 5,
    "Tell us what is missing or uncertain",
  );
export type DirectionReview = z.infer<typeof directionReviewSchema>;

export const compassSchema = z
  .object({
    northStar: text,
    priority: text,
    whyThisFits: text,
    evidenceQuestionIds: evidence,
    lifeAreas: z
      .array(
        z
          .object({
            area: text,
            observation: text,
            basis: z.enum(["answered", "unexplored"]),
            evidenceQuestionIds: z.array(z.string().min(1)).max(5),
          })
          .strict(),
      )
      .min(2)
      .max(5),
    protectedConditions: z
      .array(
        z
          .object({
            condition: text,
            evidenceQuestionIds: evidence,
          })
          .strict(),
      )
      .max(4),
    goal: z
      .object({
        evidenceQuestionIds: evidence.optional(),
        outcome: text,
        why: text,
        progress: z.array(text).min(1).max(3),
        withinYourControl: text,
      })
      .strict(),
    firstAction: z
      .object({
        evidenceQuestionIds: evidence.optional(),
        action: text,
        when: text,
        doneWhen: text,
      })
      .strict(),
    weeks: z
      .array(
        z
          .object({
            week: z.number().int().min(1).max(4),
            focus: text,
            action: text,
            doneWhen: text,
          })
          .strict(),
      )
      .length(4),
    obstacles: z
      .array(
        z
          .object({
            evidenceQuestionIds: evidence.optional(),
            obstacle: text,
            response: text,
          })
          .strict(),
      )
      .min(1)
      .max(3),
    decisionRules: z
      .array(
        z
          .object({
            evidenceQuestionIds: evidence.optional(),
            situation: text,
            rule: text,
          })
          .strict(),
      )
      .min(1)
      .max(3),
    review: z
      .object({
        when: text,
        questions: z.array(text).min(2).max(4),
        continueIf: text,
        adjustIf: text,
        stopIf: text,
      })
      .strict(),
    openQuestions: z
      .array(
        z
          .object({
            question: text,
            howToExplore: text,
          })
          .strict(),
      )
      .min(1)
      .max(3),
    alternative: z
      .object({
        direction: text,
        whenToConsider: text,
      })
      .strict(),
  })
  .strict()
  .refine(
    (value) => value.weeks.every((week, index) => week.week === index + 1),
    "Weeks must run from one to four in order",
  )
  .refine(
    (value) =>
      value.lifeAreas.every((area) =>
        area.basis === "unexplored"
          ? area.evidenceQuestionIds.length === 0
          : area.evidenceQuestionIds.length > 0,
      ),
    "Observed life areas need evidence; unexplored areas must not claim evidence",
  );
export type Compass = z.infer<typeof compassSchema>;

/** New reports must substantiate constraints wherever they affect the plan. */
export const compassGenerationSchema = compassSchema.safeExtend({
  lifeAreas: z.array(compassSchema.shape.lifeAreas.element).min(2).max(3),
  goal: compassSchema.shape.goal.extend({ evidenceQuestionIds: evidence }),
  firstAction: compassSchema.shape.firstAction.extend({
    evidenceQuestionIds: evidence,
  }),
  obstacles: z
    .array(
      compassSchema.shape.obstacles.element.extend({
        evidenceQuestionIds: evidence,
      }),
    )
    .min(1)
    .max(3),
  decisionRules: z
    .array(
      compassSchema.shape.decisionRules.element.extend({
        evidenceQuestionIds: evidence,
      }),
    )
    .min(1)
    .max(3),
});

/** Persisted by the application, never inferred by the model. */
export const directionStatusSchema = z.enum([
  "fits",
  "adjusted",
  "unsure",
  "not_reviewed",
]);

export function compassEvidenceIds(compass: Compass) {
  return [
    ...compass.evidenceQuestionIds,
    ...compass.lifeAreas.flatMap((area) => area.evidenceQuestionIds),
    ...compass.protectedConditions.flatMap((item) => item.evidenceQuestionIds),
    ...(compass.goal.evidenceQuestionIds ?? []),
    ...(compass.firstAction.evidenceQuestionIds ?? []),
    ...compass.obstacles.flatMap((item) => item.evidenceQuestionIds ?? []),
    ...compass.decisionRules.flatMap((item) => item.evidenceQuestionIds ?? []),
  ];
}
