import {
  type Analysis,
  analysisSchema,
  type GeneratedCoachPrompt,
  type Locale,
} from "@wtfiwant/shared";

export interface AIProvider {
  readonly name: string;
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
  ): Promise<unknown>;
}

export async function analyzeAnswers(
  provider: AIProvider,
  answers: Record<string, unknown>,
  safetyIdentifier?: string,
  locale: Locale = "en",
): Promise<Analysis> {
  const validate = (value: unknown) => {
    const parsed = analysisSchema.safeParse(value);
    if (!parsed.success) return parsed;
    const answerIds = new Set(Object.keys(answers));
    const evidenceIds = [
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

  const firstAttempt = validate(
    await provider.analyzeAssessment(answers, false, safetyIdentifier, locale),
  );
  if (firstAttempt.success) return firstAttempt.data;

  const repaired = validate(
    await provider.analyzeAssessment(answers, true, safetyIdentifier, locale),
  );
  if (repaired.success) return repaired.data;

  throw new Error(
    "AI provider returned invalid structured analysis after repair",
  );
}
