import type { Analysis } from "@wtfiwant/shared";
import type { AIProvider } from "./provider";

function textOf(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? "");
}

function mentions(allText: string, terms: string[]): boolean {
  return terms.some((term) => allText.includes(term));
}

function evidence(
  answers: Record<string, unknown>,
  preferred: string[],
): string[] {
  const found = preferred.filter((id) => id in answers);
  return found.length > 0 ? found : Object.keys(answers).slice(0, 1);
}

export class LocalAIProvider implements AIProvider {
  readonly name = "local-patterns-v1";

  async generateFollowUp(_questionId: string, answer: string): Promise<string> {
    const subject = answer.trim().split(/\s+/).slice(0, 8).join(" ");
    return `What would “${subject}” give you that you do not have today?`;
  }

  async analyzeAssessment(answers: Record<string, unknown>): Promise<Analysis> {
    const allText = Object.values(answers).map(textOf).join(" ").toLowerCase();
    const connection = mentions(allText, [
      "family",
      "friend",
      "partner",
      "people",
      "community",
    ]);
    const autonomy = mentions(allText, [
      "freedom",
      "autonomy",
      "control",
      "remote",
      "own time",
    ]);
    const growth = mentions(allText, [
      "build",
      "create",
      "learn",
      "challenge",
      "proud",
      "achievement",
    ]);
    const adventure = mentions(allText, [
      "travel",
      "adventure",
      "new",
      "explore",
      "exciting",
    ]);

    const coreDrivers: Analysis["coreDrivers"] = [];
    if (autonomy || coreDrivers.length === 0) {
      coreDrivers.push({
        id: "self-direction",
        name: "Self-direction",
        explanation:
          "Your answers suggest that having a meaningful say over your time and choices may matter more than following a default path.",
        evidenceQuestionIds: evidence(answers, [
          "life.chosen",
          "noise.working_toward",
          "tradeoffs.choices",
        ]),
        confidence: autonomy ? "medium" : "low",
      });
    }
    if (connection) {
      coreDrivers.push({
        id: "close-connection",
        name: "Close connection",
        explanation:
          "A recurring pattern seems to be that the people around an experience matter alongside the experience itself.",
        evidenceQuestionIds: evidence(answers, [
          "alive.memories",
          "noise.jealous",
          "tradeoffs.choices",
        ]),
        confidence: "medium",
      });
    }
    if (growth || coreDrivers.length < 2) {
      coreDrivers.push({
        id: "meaningful-growth",
        name: "Meaningful growth",
        explanation:
          "You may want challenge when it produces something you respect, rather than achievement for its own sake.",
        evidenceQuestionIds: evidence(answers, [
          "alive.memories",
          "goals.current",
          "noise.private_desire",
        ]),
        confidence: growth ? "medium" : "low",
      });
    }
    if (adventure || coreDrivers.length < 3) {
      coreDrivers.push({
        id: "aliveness",
        name: "Aliveness",
        explanation:
          "Your answers may point toward wanting enough novelty and lived experience that life does not feel postponed.",
        evidenceQuestionIds: evidence(answers, [
          "alive.memories",
          "possibilities.three_lives",
          "anti_life.regret",
        ]),
        confidence: adventure ? "medium" : "low",
      });
    }

    const tensions: Analysis["tensions"] = [];
    if (autonomy && connection) {
      tensions.push({
        id: "freedom-belonging",
        sideA: "Freedom",
        sideB: "Belonging",
        explanation:
          "You described signals of independence and close connection. A useful question may be what kind of autonomy keeps important relationships within reach.",
        evidenceQuestionIds: evidence(answers, [
          "alive.memories",
          "possibilities.three_lives",
          "tradeoffs.choices",
        ]),
      });
    }
    if (growth && mentions(allText, ["stress", "tired", "burn", "time"])) {
      tensions.push({
        id: "ambition-time",
        sideA: "Ambition",
        sideB: "Time",
        explanation:
          "Your answers suggest that doing work you respect may matter, while giving it unlimited space would reproduce a life you want to avoid.",
        evidenceQuestionIds: evidence(answers, [
          "life.energy",
          "anti_life.description",
          "goals.current",
        ]),
      });
    }

    const goalValue = answers["goals.current"] as
      | { goals?: Array<{ goal?: string; why?: string }> }
      | undefined;
    const goals = (goalValue?.goals ?? []).flatMap((goal) =>
      goal.goal && goal.why
        ? [
            {
              originalGoal: goal.goal,
              possibleUnderlyingNeed: goal.why,
              interpretation: `One possible interpretation is that “${goal.goal}” is a vehicle for ${goal.why.toLowerCase()}, rather than the endpoint itself.`,
              evidenceQuestionIds: evidence(answers, ["goals.current"]),
            },
          ]
        : [],
    );
    const antiLifeText = textOf(
      answers["anti_life.description"] ?? answers["anti_life.repeated_year"],
    );
    const primaryDirection = autonomy
      ? "Create more room to direct your own time"
      : "Make one part of your week feel deliberately chosen";

    return {
      summary:
        "Your answers suggest that a wanted life is less about finding one perfect label and more about deliberately combining the conditions that make you feel engaged, connected, and able to choose.",
      coreDrivers,
      tensions,
      externalInfluences:
        "noise.supposed" in answers
          ? [
              {
                observation:
                  "There may be a gap between what looks like a successful life from the outside and what you would still choose without an audience.",
                evidenceQuestionIds: evidence(answers, [
                  "noise.supposed",
                  "noise.private_desire",
                ]),
              },
            ]
          : [],
      antiLife: {
        themes: [
          "Life happening by default",
          "Important experiences continually postponed",
        ],
        summary: antiLifeText.trim()
          ? `You explicitly want to avoid a life that feels like: ${antiLifeText}`
          : "Your answers suggest avoiding a life shaped mainly by inertia and other people's expectations.",
        evidenceQuestionIds: evidence(answers, [
          "anti_life.description",
          "anti_life.repeated_year",
          "life.drifted",
        ]),
      },
      possibleDirections: [
        {
          title: primaryDirection,
          explanation:
            "Treat this as a design constraint to test, not a command to overturn your life.",
          whyItFits:
            "It connects the parts of your life that feel chosen with the future you do not want to postpone.",
          evidenceQuestionIds: evidence(answers, [
            "life.chosen",
            "anti_life.regret",
            "tradeoffs.choices",
          ]),
        },
        {
          title: connection
            ? "Protect connection while changing the shape of life"
            : "Collect better evidence about what makes you feel alive",
          explanation: connection
            ? "Explore changes that increase agency without treating important relationships as collateral damage."
            : "Repeat one small ingredient from an alive moment and notice what actually changes.",
          whyItFits:
            "It turns a recurring pattern in your answers into something observable in real life.",
          evidenceQuestionIds: evidence(answers, [
            "alive.memories",
            "possibilities.three_lives",
          ]),
        },
      ],
      goals,
      firstSteps: [
        {
          direction: primaryDirection,
          experiment:
            "For two weeks, protect one two-hour block for something you consciously choose.",
          immediateAction:
            "Choose the first block in your calendar and write down what it is for.",
          evidenceQuestionIds: evidence(answers, [
            "life.chosen",
            "goals.current",
          ]),
        },
        {
          direction: connection
            ? "Make connection a constraint, not an afterthought"
            : "Find another source of aliveness",
          experiment: connection
            ? "Ask one person you care about to design a small shared plan with you this month."
            : "Recreate one ingredient from an alive memory within the next seven days.",
          immediateAction: connection
            ? "Send the invitation to that person."
            : "Name the memory and circle its smallest repeatable ingredient.",
          evidenceQuestionIds: evidence(answers, [
            "alive.memories",
            "tradeoffs.choices",
          ]),
        },
      ],
    };
  }
}
