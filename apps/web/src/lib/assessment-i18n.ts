import {
  type AssessmentQuestion,
  chapters,
  getGermanAssessmentTranslation,
  type Locale,
} from "@wtfiwant/shared";

export function getLocalizedChapters(locale: Locale) {
  if (locale === "en") return chapters;
  const translation = getGermanAssessmentTranslation();
  return chapters.map((chapter, index) => ({
    ...chapter,
    ...translation.chapters[index],
  }));
}

export function getLocalizedQuestion(
  question: AssessmentQuestion,
  locale: Locale,
): AssessmentQuestion {
  if (locale === "en") return question;
  const translation = getGermanAssessmentTranslation().questions[question.id];
  if (!translation) return question;
  return { ...question, ...translation } as AssessmentQuestion;
}

export function getLocalizedOptionLabel(
  question: AssessmentQuestion,
  optionIndex: number,
  locale: Locale,
): string {
  if (locale === "en" || !("options" in question)) {
    return "options" in question ? question.options[optionIndex] : "";
  }
  return (
    getGermanAssessmentTranslation().questions[question.id]?.options?.[
      optionIndex
    ] ?? question.options[optionIndex]
  );
}
