import { z } from "zod";
import {
  type AssessmentQuestion,
  getQuestionById,
  threeLives,
  tradeoffPairs,
} from "./assessment";

const reflectionTextSchema = z.string().trim().min(1).max(10_000);

export const maxMemories = 3;
export const maxGoals = 3;

export const memoryAnswerSchema = z
  .object({
    memories: z
      .array(
        z
          .object({
            story: reflectionTextSchema,
            with: z.string().max(1_000).optional(),
            where: z.string().max(1_000).optional(),
            doing: z.string().max(1_000).optional(),
            special: z.string().max(1_000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(maxMemories),
  })
  .strict();

const lifeResponseSchema = z
  .object({
    id: z.enum(threeLives.map((life) => life.id)),
    attracts: z.string().max(5_000),
    repels: z.string().max(5_000),
  })
  .strict();

export const threeLivesAnswerSchema = z
  .object({
    lives: z.array(lifeResponseSchema).length(threeLives.length),
    customLife: z.string().max(5_000).optional(),
  })
  .strict()
  .refine(
    (answer) =>
      Boolean(answer.customLife?.trim()) ||
      answer.lives.every((life) =>
        Boolean(life.attracts.trim() || life.repels.trim()),
      ),
    { message: "Describe each life or write a custom one" },
  );

export const tradeoffAnswerSchema = z
  .object({
    choices: z
      .array(z.number().int().min(-2).max(2))
      .length(tradeoffPairs.length),
    touched: z.array(z.literal(true)).length(tradeoffPairs.length),
  })
  .strict();

export const goalsAnswerSchema = z
  .object({
    goals: z
      .array(
        z
          .object({
            goal: reflectionTextSchema,
            why: reflectionTextSchema,
          })
          .strict(),
      )
      .min(1)
      .max(maxGoals),
  })
  .strict();

export function answerSchemaForQuestion(
  question: AssessmentQuestion,
): z.ZodType {
  switch (question.type) {
    case "long_text":
      return reflectionTextSchema;
    case "single_choice":
      return reflectionTextSchema.refine(
        (value) => question.options.includes(value),
        {
          message: "Choose one of the supplied options",
        },
      );
    case "multi_choice":
      return z
        .array(reflectionTextSchema)
        .min(1)
        .max(question.options.length + (question.allowOther ? 1 : 0))
        .refine(
          (values) =>
            new Set(values).size === values.length &&
            values.filter((value) => !question.options.includes(value))
              .length <= (question.allowOther ? 1 : 0),
          {
            message:
              "Choose only supplied options and at most one custom answer",
          },
        );
    case "memories":
      return memoryAnswerSchema;
    case "three_lives":
      return threeLivesAnswerSchema;
    case "tradeoffs":
      return tradeoffAnswerSchema;
    case "goals":
      return goalsAnswerSchema;
  }
}

export function validateQuestionAnswer(
  questionId: string,
  value: unknown,
): { success: true } | { success: false; message: string } {
  const question = getQuestionById(questionId);
  if (!question) return { success: false, message: "Unknown question" };
  const parsed = answerSchemaForQuestion(question).safeParse(value);
  return parsed.success
    ? { success: true }
    : { success: false, message: "Answer does not match this question" };
}

export function isAnswerComplete(
  question: AssessmentQuestion,
  value: unknown,
): boolean {
  return (
    !question.required ||
    answerSchemaForQuestion(question).safeParse(value).success
  );
}

export function stringifyAnswerForFollowUp(value: unknown): string {
  if (typeof value === "string") return value;
  const goals = goalsAnswerSchema.safeParse(value);
  if (goals.success) {
    const first = goals.data.goals[0];
    return `${first.goal}. Why: ${first.why}`;
  }
  return JSON.stringify(value);
}

export type MemoryAnswer = z.infer<typeof memoryAnswerSchema>;
export type ThreeLivesAnswer = z.infer<typeof threeLivesAnswerSchema>;
export type TradeoffAnswer = z.infer<typeof tradeoffAnswerSchema>;
export type GoalsAnswer = z.infer<typeof goalsAnswerSchema>;
