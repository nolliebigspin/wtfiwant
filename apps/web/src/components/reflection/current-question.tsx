import {
  type AssessmentQuestion,
  assessmentQuestions,
  type Locale,
} from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { FormError } from "@/components/ui/form-error";
import {
  getLocalizedChapters,
  getLocalizedQuestion,
} from "@/lib/assessment-i18n";
import {
  eyebrowClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/lib/styles";
import { QuestionInput } from "./question-inputs";

type CurrentQuestionProps = {
  question: AssessmentQuestion;
  locale: Locale;
  chapterIndex: number;
  questionIndex: number;
  value: unknown;
  error: string | null;
  saving: boolean;
  saved: boolean;
  onAnswerChange: (value: unknown) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function CurrentQuestion({
  question,
  locale,
  chapterIndex,
  questionIndex,
  value,
  error,
  saving,
  saved,
  onAnswerChange,
  onBack,
  onContinue,
}: CurrentQuestionProps) {
  const t = useTranslations("Reflection");
  const localizedQuestion = getLocalizedQuestion(question, locale);
  const localizedChapters = getLocalizedChapters(locale);

  return (
    <section className="animate-[enter_0.35s_ease-out]" key={question.id}>
      <p className={eyebrowClassName}>
        {localizedChapters[chapterIndex].label} · {questionIndex + 1} {t("of")}{" "}
        {assessmentQuestions.length}
      </p>
      <p className="mb-5 font-[Georgia,serif] text-base text-muted italic">
        {localizedChapters[chapterIndex].eyebrow}
      </p>
      <h1 className="mb-4 max-w-[18ch] text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] tracking-[-0.07em]">
        {localizedQuestion.prompt}
      </h1>
      {localizedQuestion.description ? (
        <p className="mb-9 max-w-[42rem] text-[1.05rem] leading-relaxed text-muted">
          {localizedQuestion.description}
        </p>
      ) : null}
      <QuestionInput
        question={question}
        locale={locale}
        value={value}
        onChange={onAnswerChange}
      />
      <FormError>{error}</FormError>
      <div className="mt-8 flex items-center justify-between">
        <button
          className={secondaryButtonClassName}
          type="button"
          disabled={questionIndex === 0 || saving}
          onClick={onBack}
        >
          {t("back")}
        </button>
        <div className="flex items-center gap-4">
          <span
            className="text-[0.7rem] font-extrabold tracking-[0.12em] text-[#557033] uppercase"
            aria-live="polite"
          >
            {saved ? t("saved") : ""}
          </span>
          <button
            className={primaryButtonClassName}
            type="button"
            disabled={saving}
            onClick={onContinue}
          >
            {saving
              ? t("saving")
              : questionIndex === assessmentQuestions.length - 1
                ? t("finish")
                : t("continue")}
          </button>
        </div>
      </div>
    </section>
  );
}
