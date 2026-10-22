import {
  type Analysis,
  buildCompassSections,
  compassHeadline,
  directionStatusLabel,
  formatReportAnswer,
  type Locale,
  reflectionQuestionLabel,
} from "@wtfiwant/shared";
import { buildEmailEvidence } from "../email/evidence";

export type ReportItem = {
  title?: string;
  paragraphs: string[];
  evidence: number[];
};
export type ReportSection = { title: string; items: ReportItem[] };

/** One content model for mail and PDF, with readable, deduplicated evidence. */
export function buildReportDocument(
  analysis: Analysis,
  locale: Locale,
  source: Record<string, unknown>,
) {
  const de = locale === "de";
  const evidence = Object.entries(buildEmailEvidence(analysis, source)).map(
    ([id, value], index) => ({
      number: index + 1,
      id,
      label: reflectionQuestionLabel(id, locale),
      body: formatReportAnswer(id, value, locale),
    }),
  );
  const refs = (ids: string[]) =>
    evidence.filter((item) => ids.includes(item.id)).map((item) => item.number);
  const sections: ReportSection[] = [
    {
      title: de ? "Was wichtig zu sein scheint" : "What seems to matter",
      items: analysis.coreDrivers.map((item) => ({
        title: item.name,
        paragraphs: [item.explanation],
        evidence: refs(item.evidenceQuestionIds),
      })),
    },
    {
      title: de ? "Spannungen" : "Tensions",
      items: analysis.tensions.map((item) => ({
        title: `${item.sideA} / ${item.sideB}`,
        paragraphs: [item.explanation],
        evidence: refs(item.evidenceQuestionIds),
      })),
    },
    {
      title: de ? "Dein Anti-Leben" : "Your Anti-Life",
      items: [
        {
          paragraphs: [analysis.antiLife.summary, ...analysis.antiLife.themes],
          evidence: refs(analysis.antiLife.evidenceQuestionIds),
        },
      ],
    },
    {
      title: de ? "Äußere Einflüsse" : "Outside influences",
      items: analysis.externalInfluences.map((item) => ({
        paragraphs: [item.observation],
        evidence: refs(item.evidenceQuestionIds),
      })),
    },
    {
      title: de ? "Richtungen zum Erkunden" : "Directions worth exploring",
      items: analysis.possibleDirections.map((item) => ({
        title: item.title,
        paragraphs: [
          item.explanation,
          `${de ? "Warum es passen könnte" : "Why it may fit"}: ${item.whyItFits}`,
        ],
        evidence: refs(item.evidenceQuestionIds),
      })),
    },
    {
      title: de ? "Unter deinen Zielen" : "Beneath your goals",
      items: analysis.goals.map((item) => ({
        title: item.originalGoal,
        paragraphs: [item.possibleUnderlyingNeed, item.interpretation],
        evidence: refs(item.evidenceQuestionIds),
      })),
    },
    {
      title: de ? "Erste Schritte" : "First steps",
      items: analysis.firstSteps.map((item) => ({
        title: item.direction,
        paragraphs: [
          `Experiment: ${item.experiment}`,
          `${de ? "Jetzt" : "Now"}: ${item.immediateAction}`,
        ],
        evidence: refs(item.evidenceQuestionIds),
      })),
    },
  ];
  return {
    title: de ? "Dein vollständiger Kompass" : "Your Full Compass",
    headline: compassHeadline(
      analysis.directionStatus ?? "not_reviewed",
      locale,
    ),
    summary: analysis.compass?.northStar ?? analysis.summary,
    compass: analysis.compass ?? null,
    directionStatus: analysis.compass
      ? directionStatusLabel(analysis.directionStatus ?? "not_reviewed", locale)
      : null,
    sections: analysis.compass
      ? buildCompassSections(analysis.compass, locale).map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            title: item.title,
            paragraphs: item.paragraphs,
            evidence: refs(item.evidenceQuestionIds),
          })),
        }))
      : sections,
    evidence,
    evidenceTitle: de
      ? "Deine Antworten als Grundlage"
      : "Your answers as evidence",
    disclaimer: de
      ? "Dies ist eine geführte Reflexion, keine Diagnose, Therapie oder Krisenhilfe."
      : "This is guided reflection, not diagnosis, therapy, or crisis support.",
  };
}
