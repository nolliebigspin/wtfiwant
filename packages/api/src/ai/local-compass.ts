import type {
  Analysis,
  Compass,
  DirectionDraft,
  DirectionReview,
  Locale,
} from "@wtfiwant/shared";

/** Deterministic dev fixture, not a substitute for a paid model analysis. */
export function localDirection(
  answers: Record<string, unknown>,
  locale: Locale,
): DirectionDraft {
  const de = locale === "de";
  return {
    northStar: de
      ? "Ein Alltag mit Raum für selbst gewählte Tätigkeiten und wichtige Menschen."
      : "An ordinary life with room for chosen activities and important people.",
    priority: de
      ? "Eine passende Veränderung im Alltag erproben."
      : "Try one fitting change in everyday life.",
    why: de
      ? "Lokale Testauswertung: Prüfe diese vorläufige Richtung an deinen eigenen Antworten."
      : "Local test interpretation: check this tentative direction against your own answers.",
    evidenceQuestionIds: Object.keys(answers).slice(0, 2),
    uncertainty: de
      ? "Welche Veränderung dir wirklich hilft, muss sich im Alltag zeigen."
      : "Which change actually helps remains to be explored in everyday life.",
  };
}
export function localCompass(
  analysis: Analysis,
  answers: Record<string, unknown>,
  locale: Locale,
  direction?: { draft: DirectionDraft; review: DirectionReview | null },
): Compass {
  const de = locale === "de";
  const draft =
    direction?.review ?? direction?.draft ?? localDirection(answers, locale);
  const step = analysis.firstSteps[0];
  return {
    northStar: draft.northStar,
    priority: draft.priority,
    whyThisFits: analysis.summary,
    evidenceQuestionIds: analysis.coreDrivers[0].evidenceQuestionIds,
    lifeAreas: [
      {
        area: de ? "Alltag" : "Everyday life",
        observation: analysis.coreDrivers[0].explanation,
        basis: "answered",
        evidenceQuestionIds: analysis.coreDrivers[0].evidenceQuestionIds,
      },
      {
        area: de ? "Weitere Lebensbereiche" : "Other areas of life",
        observation: de
          ? "Dazu fehlen konkrete Angaben; hier wird keine Vorliebe unterstellt."
          : "Specific information is missing; no preference is assumed here.",
        basis: "unexplored",
        evidenceQuestionIds: [],
      },
    ],
    protectedConditions: [],
    goal: {
      evidenceQuestionIds: analysis.coreDrivers[0].evidenceQuestionIds,
      outcome: de
        ? "Innerhalb von 90 Tagen entscheiden, welche kleine Veränderung du fortsetzen möchtest."
        : "Within 90 days, decide which small change you want to continue.",
      why: de
        ? "Erfahrungen prüfen die vorläufige Richtung."
        : "Experience can test this tentative direction.",
      progress: [
        de
          ? "Du kannst einen konkreten Nutzen und einen Nachteil benennen."
          : "You can name a concrete benefit and downside.",
      ],
      withinYourControl: de
        ? "Du wählst einen kleinen Versuch und passt ihn an deine Möglichkeiten an."
        : "Choose a small trial and adapt it to your circumstances.",
    },
    firstAction: {
      evidenceQuestionIds: analysis.firstSteps[0].evidenceQuestionIds,
      action: step.immediateAction,
      when: de
        ? "Wenn diese Woche ein kurzer freier Moment passt."
        : "During a short available moment this week.",
      doneWhen: de
        ? "Ein machbarer nächster Schritt steht fest."
        : "A feasible next step is defined.",
    },
    weeks: [1, 2, 3, 4].map((week) => ({
      week,
      focus: (de
        ? ["Vorbereiten", "Ausprobieren", "Anpassen", "Auswerten"]
        : ["Prepare", "Try", "Adapt", "Review"])[week - 1],
      action:
        week === 2
          ? step.experiment
          : de
            ? "Prüfe den Versuch an deinen Möglichkeiten und notiere eine konkrete Beobachtung."
            : "Check the trial against your circumstances and note one concrete observation.",
      doneWhen: de
        ? "Eine Beobachtung oder bewusste Anpassung ist festgehalten."
        : "One observation or deliberate adjustment is recorded.",
    })),
    obstacles: [
      {
        evidenceQuestionIds: analysis.coreDrivers[0].evidenceQuestionIds,
        obstacle: de
          ? "Der Versuch passt zeitlich nicht in deinen Alltag."
          : "The trial does not fit your available time.",
        response: de
          ? "Verkleinere ihn oder verschiebe ihn bewusst, statt Verpflichtungen zu übergehen."
          : "Make it smaller or deliberately postpone it rather than ignoring obligations.",
      },
    ],
    decisionRules: [
      {
        evidenceQuestionIds: analysis.coreDrivers[0].evidenceQuestionIds,
        situation: de
          ? "Eine neue Verpflichtung kommt hinzu."
          : "A new commitment comes up.",
        rule: de
          ? "Prüfe zuerst, was dafür entfallen kann und ob die Richtung noch passt."
          : "First check what it replaces and whether it serves your direction.",
      },
    ],
    review: {
      when: de
        ? "Nach vier Wochen, zu einem selbst gewählten Zeitpunkt."
        : "After four weeks, at a time you choose.",
      questions: [
        de ? "Was wollte ich wieder tun?" : "What did I want to do again?",
        de ? "Was hat es mich gekostet?" : "What did it cost me?",
      ],
      continueIf: de
        ? "Der Nutzen ist spürbar und der Aufwand tragbar."
        : "The benefit is noticeable and the cost manageable.",
      adjustIf: de
        ? "Die Richtung passt, aber der Umfang nicht."
        : "The direction fits but the scope does not.",
      stopIf: de
        ? "Der Versuch schadet wichtigen Verpflichtungen oder passt nicht."
        : "The trial harms important obligations or does not fit.",
    },
    openQuestions: [
      {
        question: de
          ? "Was fehlt in dieser Richtung noch?"
          : "What is missing from this direction?",
        howToExplore: de
          ? "Vergleiche einen konkreten guten Tag mit dem Vorschlag."
          : "Compare a concrete good day with this proposal.",
      },
    ],
    alternative: {
      direction: de
        ? "Zunächst nur beobachten und eine kleinere Veränderung wählen."
        : "Start by observing and choose a smaller change.",
      whenToConsider: de
        ? "Wenn die Voraussetzungen für den Versuch noch fehlen."
        : "If the prerequisites for the trial are missing.",
    },
  };
}
