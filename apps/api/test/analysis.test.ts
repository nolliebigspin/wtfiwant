import { describe, expect, test } from "bun:test";
import type { Analysis } from "@wtfiwant/shared";
import { type AIProvider, analyzeAnswers } from "../src/ai/provider";

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
    },
    {
      title: "Protect close relationships",
      explanation: "Design autonomy without disappearing from your people.",
      whyItFits: "Connection appears alongside independence.",
    },
  ],
  goals: [],
  firstSteps: [
    {
      direction: "Build more autonomy into work",
      experiment: "Try one remote workday each week for a month",
      immediateAction: "Ask which day could work",
    },
  ],
};

describe("analysis validation", () => {
  test("repairs malformed provider output once before returning validated analysis", async () => {
    let attempts = 0;
    const provider: AIProvider = {
      name: "test-model",
      async generateFollowUp() {
        return "What would that give you?";
      },
      async analyzeAssessment(_answers, repair) {
        attempts += 1;
        return repair ? validAnalysis : { summary: "missing everything else" };
      },
    };

    const result = await analyzeAnswers(provider, {
      "life.chosen": "Control over my time",
      "anti_life.description": "Work controlling every hour",
    });

    expect(result).toEqual(validAnalysis);
    expect(attempts).toBe(2);
  });
});
