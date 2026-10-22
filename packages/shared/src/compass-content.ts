import type { z } from "zod";
import type { Compass, directionStatusSchema } from "./compass";
import type { Locale } from "./localization";

export type CompassSection = {
  title: string;
  kind: "insight" | "goal" | "roadmap" | "decisions" | "review";
  items: {
    title?: string;
    paragraphs: string[];
    evidenceQuestionIds: string[];
  }[];
};

/** Arrows represent the order of action, never a score or completion state. */
export function compassPath(compass: Compass, locale: Locale) {
  const de = locale === "de";
  return [
    { id: "priority", label: de ? "JETZT" : "NOW", body: compass.priority },
    {
      id: "start",
      label: de ? "DEIN START" : "YOUR START",
      body: compass.firstAction.action,
    },
    {
      id: "horizon",
      label: de ? "IN 90 TAGEN" : "IN 90 DAYS",
      body: compass.goal.outcome,
    },
  ];
}
export function directionStatusLabel(
  status: z.infer<typeof directionStatusSchema>,
  locale: Locale,
) {
  const labels =
    locale === "de"
      ? {
          fits: "Von dir als passend bestätigt",
          adjusted: "Von dir gewählte Richtung",
          unsure: "Vorläufig · von dir zum Erkunden gewählt",
          not_reviewed: "Vorläufig · noch nicht von dir geprüft",
        }
      : {
          fits: "Confirmed by you as fitting",
          adjusted: "Your chosen direction",
          unsure: "Provisional · you chose to explore it",
          not_reviewed: "Provisional · not yet reviewed by you",
        };
  return labels[status];
}

/** Identical substantive content for web, email and PDF. */
export function buildCompassSections(
  compass: Compass,
  locale: Locale,
): CompassSection[] {
  const de = locale === "de";
  const item = (
    title: string,
    paragraphs: string[],
    evidenceQuestionIds: string[] = [],
  ) => ({ title, paragraphs, evidenceQuestionIds });
  return [
    {
      kind: "insight",
      title: de
        ? "Warum diese Richtung zu dir passen könnte"
        : "Why this direction may fit",
      items: [
        item(
          de ? "Was deine Antworten verbindet" : "What connects your answers",
          [compass.whyThisFits],
          compass.evidenceQuestionIds,
        ),
        ...compass.lifeAreas
          .filter((area) => area.basis === "answered")
          .map((area) =>
            item(
              `${area.area}${area.basis === "unexplored" ? (de ? " · noch offen" : " · unexplored") : ""}`,
              [area.observation],
              area.evidenceQuestionIds,
            ),
          ),
        ...(compass.protectedConditions.length
          ? [
              item(
                de ? "Deine Leitplanken" : "Your guardrails",
                compass.protectedConditions.map(
                  (condition) => condition.condition,
                ),
                [
                  ...new Set(
                    compass.protectedConditions.flatMap(
                      (condition) => condition.evidenceQuestionIds,
                    ),
                  ),
                ],
              ),
            ]
          : []),
      ],
    },
    {
      title: de
        ? "Dein Ziel für die nächsten 90 Tage"
        : "Your goal for the next 90 days",
      kind: "goal",
      items: [
        item(
          de ? "Was du erreichen möchtest" : "What you want to reach",
          [compass.goal.outcome, compass.goal.why],
          compass.goal.evidenceQuestionIds ?? compass.evidenceQuestionIds,
        ),
        item(
          de ? "Daran erkennst du Fortschritt" : "How to notice progress",
          compass.goal.progress,
        ),
        item(
          de ? "Das liegt in deinem Einfluss" : "What is within your influence",
          [compass.goal.withinYourControl],
        ),
      ],
    },
    {
      title: de ? "Deine nächsten vier Wochen" : "Your next four weeks",
      kind: "roadmap",
      items: [
        item(
          de ? "Dein erster Schritt" : "Your first step",
          [
            compass.firstAction.action,
            `${de ? "Wann" : "When"}: ${compass.firstAction.when}`,
            `${de ? "Erledigt, wenn" : "Done when"}: ${compass.firstAction.doneWhen}`,
          ],
          compass.firstAction.evidenceQuestionIds ??
            compass.evidenceQuestionIds,
        ),
        ...compass.weeks.map((week) =>
          item(`${de ? "Woche" : "Week"} ${week.week} · ${week.focus}`, [
            week.action,
            `${de ? "Erledigt, wenn" : "Done when"}: ${week.doneWhen}`,
          ]),
        ),
      ],
    },
    {
      title: de ? "Wenn es schwierig wird" : "When things get difficult",
      kind: "decisions",
      items: [
        ...compass.obstacles.map((obstacle) =>
          item(
            obstacle.obstacle,
            [obstacle.response],
            obstacle.evidenceQuestionIds ?? [],
          ),
        ),
        ...compass.decisionRules.map((rule) =>
          item(rule.situation, [rule.rule], rule.evidenceQuestionIds ?? []),
        ),
      ],
    },
    {
      title: de ? "Prüfen und Kurs halten" : "Review and adjust your course",
      kind: "review",
      items: [
        item(de ? "Dein Rückblick" : "Your check-in", [
          compass.review.when,
          ...compass.review.questions,
        ]),
        item(de ? "Fortsetzen, wenn …" : "Continue if …", [
          compass.review.continueIf,
        ]),
        item(de ? "Anpassen, wenn …" : "Adjust if …", [
          compass.review.adjustIf,
        ]),
        item(
          de ? "Den Versuch pausieren, wenn …" : "Pause the experiment if …",
          [compass.review.stopIf],
        ),
        item(de ? "Eine Alternative" : "An alternative", [
          compass.alternative.direction,
          compass.alternative.whenToConsider,
        ]),
        ...compass.openQuestions.map((question) =>
          item(question.question, [question.howToExplore]),
        ),
      ],
    },
  ];
}

/** An unreviewed direction must never be sold back as a settled conclusion. */
export function compassHeadline(
  status: z.infer<typeof directionStatusSchema>,
  locale: Locale,
) {
  const reviewed = status === "fits" || status === "adjusted";
  return locale === "de"
    ? reviewed
      ? "Dein persönlicher Kompass."
      : "Eine Richtung zum Erkunden."
    : reviewed
      ? "Your personal Compass."
      : "A direction to explore.";
}
