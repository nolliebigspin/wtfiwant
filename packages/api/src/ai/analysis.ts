import type { Locale, StoredAnalysis } from "@wtfiwant/shared";
import { ANALYSIS_PROMPT_VERSION } from "../prompts/analysis";
import type { AssessmentRecord } from "../repositories/types";
import { type AIProvider, analyzeAnswers } from "./provider";

export function buildAnalysisAnswers(record: AssessmentRecord, locale: Locale) {
  const additionalAnswer =
    locale === "de"
      ? "Zusätzliche Antwort aus der Reflexion"
      : "Additional answer from the reflection";
  return {
    ...record.answers,
    ...Object.fromEntries(
      record.followUps.flatMap((followUp) =>
        followUp.userResponse
          ? [
              [
                `followup:${followUp.questionId}:${followUp.id}`,
                {
                  question:
                    followUp.locale === locale
                      ? followUp.generatedQuestion
                      : additionalAnswer,
                  answer: followUp.userResponse,
                },
              ],
            ]
          : [],
      ),
    ),
    ...Object.fromEntries(
      record.coachPrompts.flatMap((prompt) =>
        prompt.userResponse
          ? [
              [
                `coach:${prompt.chapter}:${prompt.id}`,
                {
                  question:
                    prompt.locale === locale
                      ? prompt.question
                      : additionalAnswer,
                  answer: prompt.userResponse,
                },
              ],
            ]
          : [],
      ),
    ),
  };
}

/** Reuse only a report in the requested language; never relabel cached content. */
export async function analysisInLocale(
  provider: AIProvider,
  record: AssessmentRecord,
  locale: Locale,
): Promise<StoredAnalysis> {
  if (record.analysis?.locale === locale) return record.analysis;
  const result = await analyzeAnswers(
    provider,
    buildAnalysisAnswers(record, locale),
    record.session.id,
    locale,
  );
  return {
    version: ANALYSIS_PROMPT_VERSION,
    model: provider.name,
    locale,
    result,
    createdAt: new Date().toISOString(),
  };
}
