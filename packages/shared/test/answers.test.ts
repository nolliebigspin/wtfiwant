import { describe, expect, test } from "bun:test";
import {
  getQuestionById,
  isAnswerComplete,
  stringifyAnswerForFollowUp,
  threeLives,
  tradeoffPairs,
} from "../src";

describe("shared assessment answer contracts", () => {
  test("serializes structured follow-up context in the requested language", () => {
    const goals = { goals: [{ goal: "Mehr Zeit", why: "Mehr Freiheit" }] };
    expect(stringifyAnswerForFollowUp(goals, "de")).toBe(
      "Mehr Zeit. Warum: Mehr Freiheit",
    );
  });

  test("trade-offs require an explicit interaction with every competing good", () => {
    const question = getQuestionById("tradeoffs.choices");
    if (!question) throw new Error("Trade-off question is missing");

    expect(
      isAnswerComplete(question, {
        choices: tradeoffPairs.map(() => 0),
        touched: tradeoffPairs.map(() => false),
      }),
    ).toBe(false);
    expect(
      isAnswerComplete(question, {
        choices: tradeoffPairs.map(() => 0),
        touched: tradeoffPairs.map(() => true),
      }),
    ).toBe(true);
  });

  test("a custom life can replace responding to all three stereotypes", () => {
    const question = getQuestionById("possibilities.three_lives");
    if (!question) throw new Error("Three Lives question is missing");

    expect(
      isAnswerComplete(question, {
        lives: threeLives.map((life) => ({
          id: life.id,
          attracts: "",
          repels: "",
        })),
        customLife: "A home base with short periods of travel.",
      }),
    ).toBe(true);
  });
});
