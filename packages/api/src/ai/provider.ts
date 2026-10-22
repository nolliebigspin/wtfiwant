import {
  type Analysis,
  analysisSchema,
  type Compass,
  compassAnalysisSchema,
  compassEvidenceIds,
  type DirectionDraft,
  type DirectionReview,
  type GeneratedCoachPrompt,
  type Locale,
  type RefinementPlan,
} from "@wtfiwant/shared";

import { evidenceContract } from "./evidence";

export interface AIProvider {
  readonly name: string;
  reviewCompass?(
    draft: Compass,
    answers: Record<string, unknown>,
    safetyIdentifier: string | undefined,
    locale: Locale,
    direction?: { draft: DirectionDraft; review: DirectionReview | null },
  ): Promise<unknown>;
  generateRefinementPlan?(
    answers: Record<string, unknown>,
    safetyIdentifier: string,
    locale: Locale,
    repair?: boolean,
  ): Promise<RefinementPlan>;
  generateDirection?(
    answers: Record<string, unknown>,
    safetyIdentifier: string,
    locale: Locale,
    repair?: boolean,
  ): Promise<DirectionDraft>;
  generateCoachPrompt(
    answers: Record<string, unknown>,
    safetyIdentifier?: string,
    locale?: Locale,
  ): Promise<GeneratedCoachPrompt>;
  generateFollowUp(
    questionId: string,
    answer: string,
    safetyIdentifier?: string,
    locale?: Locale,
  ): Promise<string>;
  analyzeAssessment(
    answers: Record<string, unknown>,
    repair: boolean,
    safetyIdentifier?: string,
    locale?: Locale,
    direction?: { draft: DirectionDraft; review: DirectionReview | null },
  ): Promise<unknown>;
}

export async function analyzeAnswers(
  provider: AIProvider,
  answers: Record<string, unknown>,
  safetyIdentifier?: string,
  locale: Locale = "en",
  direction?: { draft: DirectionDraft; review: DirectionReview | null },
  requireCompass = false,
): Promise<Analysis> {
  const validate = (value: unknown) => {
    const parsed = (
      requireCompass ? compassAnalysisSchema : analysisSchema
    ).safeParse(value);
    if (!parsed.success) return parsed;
    if (!evidenceContract(parsed.data, answers))
      return { success: false as const };
    const answerIds = new Set(Object.keys(answers));
    const evidenceIds = [
      ...(parsed.data.compass ? compassEvidenceIds(parsed.data.compass) : []),
      ...parsed.data.coreDrivers.flatMap((item) => item.evidenceQuestionIds),
      ...parsed.data.tensions.flatMap((item) => item.evidenceQuestionIds),
      ...parsed.data.externalInfluences.flatMap(
        (item) => item.evidenceQuestionIds,
      ),
      ...parsed.data.antiLife.evidenceQuestionIds,
      ...parsed.data.possibleDirections.flatMap(
        (item) => item.evidenceQuestionIds,
      ),
      ...parsed.data.goals.flatMap((item) => item.evidenceQuestionIds),
      ...parsed.data.firstSteps.flatMap((item) => item.evidenceQuestionIds),
    ];
    return evidenceIds.every((id) => answerIds.has(id))
      ? parsed
      : { success: false as const };
  };

  const attempt = async (repair: boolean) => {
    try {
      return validate(
        await provider.analyzeAssessment(
          answers,
          repair,
          safetyIdentifier,
          locale,
          direction,
        ),
      );
    } catch {
      return { success: false as const };
    }
  };
  const firstAttempt = await attempt(false);
  const candidate = firstAttempt.success ? firstAttempt : await attempt(true);
  if (!candidate.success)
    throw new Error(
      "AI provider returned invalid structured analysis after repair",
    );
  // Only paid compass jobs request this edit. Downloads and resends use saved results.
  if (requireCompass && candidate.data.compass && provider.reviewCompass) {
    const edited = validate({
      ...candidate.data,
      compass: await provider.reviewCompass(
        candidate.data.compass,
        answers,
        safetyIdentifier,
        locale,
        direction,
      ),
    });
    if (!edited.success) throw new Error("Invalid edited compass");
    return edited.data;
  }
  return candidate.data;
}
