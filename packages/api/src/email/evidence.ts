import type { Analysis } from "@wtfiwant/shared";

export function buildEmailEvidence(
  analysis: Analysis,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const ids = new Set([
    ...analysis.coreDrivers.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.tensions.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.antiLife.evidenceQuestionIds,
    ...analysis.externalInfluences.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.possibleDirections.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.goals.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.firstSteps.flatMap((item) => item.evidenceQuestionIds),
  ]);
  return Object.fromEntries(
    [...ids].flatMap((id) => (id in source ? [[id, source[id]]] : [])),
  );
}
