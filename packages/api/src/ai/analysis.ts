import type { Locale } from "@wtfiwant/shared";
import type { AssessmentRecord } from "../repositories/types";

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
