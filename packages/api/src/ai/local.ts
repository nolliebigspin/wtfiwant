import {
  type Analysis,
  COACH_PROMPT_VERSION,
  type Locale,
} from "@wtfiwant/shared";
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

  async generateCoachPrompt(
    answers: Record<string, unknown>,
    _safetyIdentifier?: string,
    locale: Locale = "en",
  ) {
    const [questionId, value] = Object.entries(answers).at(-1) ?? ["", ""];
    const subject = textOf(value).trim().split(/\s+/).slice(0, 8).join(" ");
    return {
      question:
        locale === "de"
          ? `Was ist an „${subject}“ für dich am wichtigsten?`
          : `What matters most to you about “${subject}”?`,
      evidenceQuestionIds: [questionId],
      promptVersion: COACH_PROMPT_VERSION,
    };
  }

  async generateFollowUp(
    _questionId: string,
    answer: string,
    _safetyIdentifier?: string,
    locale: Locale = "en",
  ): Promise<string> {
    const subject = answer.trim().split(/\s+/).slice(0, 8).join(" ");
    return locale === "de"
      ? `Was würde dir „${subject}“ geben, das dir heute fehlt?`
      : `What would “${subject}” give you that you do not have today?`;
  }

  async analyzeAssessment(
    answers: Record<string, unknown>,
    _repair?: boolean,
    _safetyIdentifier?: string,
    locale: Locale = "en",
  ): Promise<Analysis> {
    const allText = Object.values(answers).map(textOf).join(" ").toLowerCase();
    const connection = mentions(allText, [
      "family",
      "friend",
      "partner",
      "people",
      "community",
      "familie",
      "freund",
      "menschen",
      "gemeinschaft",
    ]);
    const autonomy = mentions(allText, [
      "freedom",
      "autonomy",
      "control",
      "remote",
      "own time",
      "freiheit",
      "selbstbestimmung",
      "eigene zeit",
    ]);
    const growth = mentions(allText, [
      "build",
      "create",
      "learn",
      "challenge",
      "proud",
      "achievement",
      "aufbauen",
      "lernen",
      "herausforderung",
      "stolz",
    ]);
    const adventure = mentions(allText, [
      "travel",
      "adventure",
      "new",
      "explore",
      "exciting",
      "reisen",
      "abenteuer",
      "erkunden",
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

    const result: Analysis = {
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
    return locale === "de" ? translateLocalAnalysis(result) : result;
  }
}

const germanText = new Map<string, string>([
  ["Self-direction", "Selbstbestimmung"],
  ["Close connection", "Enge Verbundenheit"],
  ["Meaningful growth", "Sinnvolles Wachstum"],
  ["Aliveness", "Lebendigkeit"],
  ["Freedom", "Freiheit"],
  ["Belonging", "Zugehörigkeit"],
  ["Ambition", "Ambition"],
  ["Time", "Zeit"],
  ["Life happening by default", "Ein Leben im Autopilot"],
  [
    "Important experiences continually postponed",
    "Wichtige Erfahrungen ständig aufgeschoben",
  ],
  [
    "Create more room to direct your own time",
    "Mehr Raum schaffen, um die eigene Zeit zu gestalten",
  ],
  [
    "Make one part of your week feel deliberately chosen",
    "Einen Teil deiner Woche bewusst selbst wählen",
  ],
  [
    "Protect connection while changing the shape of life",
    "Verbundenheit schützen, während du dein Leben veränderst",
  ],
  [
    "Collect better evidence about what makes you feel alive",
    "Bessere Hinweise darauf sammeln, was dich lebendig macht",
  ],
  [
    "Make connection a constraint, not an afterthought",
    "Verbundenheit als Bedingung behandeln, nicht als Nachgedanken",
  ],
  [
    "Find another source of aliveness",
    "Eine weitere Quelle von Lebendigkeit finden",
  ],
  [
    "Your answers suggest that having a meaningful say over your time and choices may matter more than following a default path.",
    "Deine Antworten deuten darauf hin, dass echter Einfluss auf deine Zeit und Entscheidungen wichtiger sein könnte, als einem vorgegebenen Weg zu folgen.",
  ],
  [
    "A recurring pattern seems to be that the people around an experience matter alongside the experience itself.",
    "Ein wiederkehrendes Muster scheint zu sein, dass die Menschen um eine Erfahrung herum ebenso wichtig sind wie die Erfahrung selbst.",
  ],
  [
    "You may want challenge when it produces something you respect, rather than achievement for its own sake.",
    "Du möchtest vielleicht Herausforderungen, wenn daraus etwas entsteht, das du respektierst – statt Erfolg um seiner selbst willen.",
  ],
  [
    "Your answers may point toward wanting enough novelty and lived experience that life does not feel postponed.",
    "Deine Antworten könnten auf den Wunsch nach genug Neuem und gelebter Erfahrung hindeuten, damit sich das Leben nicht aufgeschoben anfühlt.",
  ],
  [
    "You described signals of independence and close connection. A useful question may be what kind of autonomy keeps important relationships within reach.",
    "Du hast Signale von Unabhängigkeit und enger Verbundenheit beschrieben. Eine nützliche Frage könnte sein, welche Art von Autonomie wichtige Beziehungen in Reichweite hält.",
  ],
  [
    "Your answers suggest that doing work you respect may matter, while giving it unlimited space would reproduce a life you want to avoid.",
    "Deine Antworten deuten darauf hin, dass dir Arbeit wichtig sein könnte, die du respektierst – während unbegrenzter Raum dafür genau das Leben erzeugen würde, das du vermeiden willst.",
  ],
  [
    "Your answers suggest that a wanted life is less about finding one perfect label and more about deliberately combining the conditions that make you feel engaged, connected, and able to choose.",
    "Deine Antworten deuten darauf hin, dass ein gewünschtes Leben weniger von einem perfekten Etikett als von einer bewussten Kombination der Bedingungen abhängt, unter denen du dich beteiligt, verbunden und entscheidungsfähig fühlst.",
  ],
  [
    "There may be a gap between what looks like a successful life from the outside and what you would still choose without an audience.",
    "Zwischen einem von außen erfolgreich wirkenden Leben und dem, was du ohne Publikum wählen würdest, könnte eine Lücke liegen.",
  ],
  [
    "Your answers suggest avoiding a life shaped mainly by inertia and other people's expectations.",
    "Deine Antworten deuten darauf hin, dass du ein Leben vermeiden willst, das vor allem von Trägheit und den Erwartungen anderer geprägt ist.",
  ],
  [
    "Treat this as a design constraint to test, not a command to overturn your life.",
    "Behandle das als eine Bedingung zum Testen, nicht als Aufforderung, dein Leben umzuwerfen.",
  ],
  [
    "It connects the parts of your life that feel chosen with the future you do not want to postpone.",
    "Das verbindet die bewusst gewählten Teile deines Lebens mit der Zukunft, die du nicht aufschieben willst.",
  ],
  [
    "Explore changes that increase agency without treating important relationships as collateral damage.",
    "Erkunde Veränderungen, die deine Handlungsfreiheit erhöhen, ohne wichtige Beziehungen als Kollateralschaden zu behandeln.",
  ],
  [
    "Repeat one small ingredient from an alive moment and notice what actually changes.",
    "Wiederhole eine kleine Zutat aus einem lebendigen Moment und beobachte, was sich wirklich verändert.",
  ],
  [
    "It turns a recurring pattern in your answers into something observable in real life.",
    "Das macht ein wiederkehrendes Muster aus deinen Antworten im echten Leben beobachtbar.",
  ],
  [
    "For two weeks, protect one two-hour block for something you consciously choose.",
    "Reserviere zwei Wochen lang einen zweistündigen Block für etwas, das du bewusst wählst.",
  ],
  [
    "Choose the first block in your calendar and write down what it is for.",
    "Wähle den ersten Block in deinem Kalender und notiere, wofür er da ist.",
  ],
  [
    "Ask one person you care about to design a small shared plan with you this month.",
    "Bitte diesen Monat einen wichtigen Menschen, mit dir einen kleinen gemeinsamen Plan zu entwerfen.",
  ],
  [
    "Recreate one ingredient from an alive memory within the next seven days.",
    "Stelle in den nächsten sieben Tagen eine Zutat aus einer lebendigen Erinnerung wieder her.",
  ],
  [
    "Send the invitation to that person.",
    "Schicke dieser Person die Einladung.",
  ],
  [
    "Name the memory and circle its smallest repeatable ingredient.",
    "Benenne die Erinnerung und markiere ihre kleinste wiederholbare Zutat.",
  ],
]);

function translateText(text: string): string {
  const direct = germanText.get(text);
  if (direct) return direct;
  const goal = text.match(
    /^One possible interpretation is that “(.+)” is a vehicle for (.+), rather than the endpoint itself\.$/u,
  );
  if (goal)
    return `Eine mögliche Interpretation ist, dass „${goal[1]}“ ein Mittel für ${goal[2]} ist und nicht das eigentliche Ziel.`;
  const antiLife = text.match(
    /^You explicitly want to avoid a life that feels like: (.+)$/su,
  );
  if (antiLife)
    return `Du möchtest ausdrücklich ein Leben vermeiden, das sich so anfühlt: ${antiLife[1]}`;
  return text;
}

function translateLocalAnalysis(result: Analysis): Analysis {
  return {
    ...result,
    summary: translateText(result.summary),
    coreDrivers: result.coreDrivers.map((item) => ({
      ...item,
      name: translateText(item.name),
      explanation: translateText(item.explanation),
    })),
    tensions: result.tensions.map((item) => ({
      ...item,
      sideA: translateText(item.sideA),
      sideB: translateText(item.sideB),
      explanation: translateText(item.explanation),
    })),
    externalInfluences: result.externalInfluences.map((item) => ({
      ...item,
      observation: translateText(item.observation),
    })),
    antiLife: {
      ...result.antiLife,
      themes: result.antiLife.themes.map(translateText),
      summary: translateText(result.antiLife.summary),
    },
    possibleDirections: result.possibleDirections.map((item) => ({
      ...item,
      title: translateText(item.title),
      explanation: translateText(item.explanation),
      whyItFits: translateText(item.whyItFits),
    })),
    goals: result.goals.map((item) => ({
      ...item,
      interpretation: translateText(item.interpretation),
    })),
    firstSteps: result.firstSteps.map((item) => ({
      ...item,
      direction: translateText(item.direction),
      experiment: translateText(item.experiment),
      immediateAction: translateText(item.immediateAction),
    })),
  };
}
