import { describe, expect, test } from "bun:test";
import {
  type Analysis,
  analysisResponseSchema,
  assessmentQuestions,
  followUpSchema,
  sessionViewSchema,
  threeLives,
  tradeoffPairs,
} from "@wtfiwant/shared";
import type { AIProvider } from "../src/ai/provider";
import { createApp } from "../src/app";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

const validAnalysis: Analysis = {
  summary:
    "Your answers suggest that self-direction and close relationships both matter.",
  coreDrivers: [
    {
      id: "autonomy",
      name: "Autonomy",
      explanation: "You repeatedly described wanting control over your time.",
      evidenceQuestionIds: ["life.chosen"],
      confidence: "medium",
    },
    {
      id: "connection",
      name: "Connection",
      explanation: "Your alive moments include people you trust.",
      evidenceQuestionIds: ["alive.memories"],
      confidence: "medium",
    },
    {
      id: "growth",
      name: "Growth",
      explanation: "Chosen challenges appear to matter.",
      evidenceQuestionIds: ["goals.current"],
      confidence: "low",
    },
  ],
  tensions: [],
  externalInfluences: [],
  antiLife: {
    themes: ["Time controlled by work"],
    summary: "A life where work consumes the time you want to direct yourself.",
    evidenceQuestionIds: ["anti_life.description"],
  },
  possibleDirections: [
    {
      title: "Test more autonomy",
      explanation: "Try a bounded change to how you work.",
      whyItFits: "It directly tests a repeated preference.",
      evidenceQuestionIds: ["life.chosen"],
    },
    {
      title: "Protect close relationships",
      explanation: "Design autonomy without disappearing from your people.",
      whyItFits: "Connection appears alongside independence.",
      evidenceQuestionIds: ["alive.memories"],
    },
  ],
  goals: [],
  firstSteps: [
    {
      direction: "Build more autonomy into work",
      experiment: "Try one remote workday each week for a month",
      immediateAction: "Ask which day could work",
      evidenceQuestionIds: ["goals.current"],
    },
  ],
};

describe("analysis validation", () => {
  test("repairs malformed provider output once through the HTTP analysis interface", async () => {
    let attempts = 0;
    let receivedAnswers: Record<string, unknown> = {};
    const provider: AIProvider = {
      name: "test-model",
      async generateFollowUp() {
        return "What would that give you?";
      },
      async analyzeAssessment(answers, repair) {
        attempts += 1;
        receivedAnswers = answers;
        return repair ? validAnalysis : { summary: "missing everything else" };
      },
    };

    const app = createApp({
      repository: new InMemoryAssessmentRepository(),
      aiProvider: provider,
    });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );
    for (const question of assessmentQuestions) {
      const value = (() => {
        switch (question.type) {
          case "long_text":
            return `A considered answer for ${question.id}`;
          case "multi_choice":
            return [question.options[0]];
          case "single_choice":
            return question.options[0];
          case "memories":
            return {
              memories: [
                {
                  story:
                    "A long dinner with close friends after making something difficult.",
                  with: "Friends",
                  where: "Home",
                  doing: "Cooking",
                  special: "Nobody was rushing",
                },
              ],
            };
          case "three_lives":
            return {
              lives: threeLives.map((life) => ({
                id: life.id,
                attracts: "One useful attribute",
                repels: "One honest cost",
              })),
            };
          case "tradeoffs":
            return {
              choices: tradeoffPairs.map(() => 1),
              touched: tradeoffPairs.map(() => true),
            };
          case "goals":
            return {
              goals: [
                {
                  goal: "Shape my own working week",
                  why: "Have energy for people and chosen projects",
                },
              ],
            };
        }
      })();
      const response = await app.request(
        `/sessions/${created.session.id}/answers/${question.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value }),
        },
      );
      expect(response.status).toBe(200);
    }

    const generatedResponse = await app.request(
      `/sessions/${created.session.id}/follow-up`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: "goals.current" }),
      },
    );
    const generatedBody = (await generatedResponse.json()) as {
      followUp: unknown;
    };
    const followUp = followUpSchema.parse(generatedBody.followUp);
    await app.request(
      `/sessions/${created.session.id}/follow-up/${followUp.id}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          response:
            "It would let me decide when my best attention is available.",
        }),
      },
    );

    const response = await app.request(
      `/sessions/${created.session.id}/analyze`,
      {
        method: "POST",
      },
    );
    const result = analysisResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(result.status).toBe("complete");
    if (result.status === "complete")
      expect(result.analysis.result).toEqual(validAnalysis);
    expect(attempts).toBe(2);
    expect(
      Object.values(receivedAnswers).some((value) =>
        JSON.stringify(value).includes(
          "It would let me decide when my best attention is available.",
        ),
      ),
    ).toBe(true);
  });
});
