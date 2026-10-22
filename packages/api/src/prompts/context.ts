import {
  formatReportAnswer,
  type Locale,
  reflectionQuestionLabel,
} from "@wtfiwant/shared";

/** Keep stable evidence IDs while supplying the meanings of numeric choices. */
export function answerContext(
  answers: Record<string, unknown>,
  locale: Locale,
) {
  return Object.fromEntries(
    Object.entries(answers).map(([id, answer]) => [
      id,
      {
        question: reflectionQuestionLabel(id, locale),
        answer: formatReportAnswer(id, answer, locale),
      },
    ]),
  );
}
