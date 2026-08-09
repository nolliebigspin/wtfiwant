import {
  type AssessmentQuestion,
  assessmentQuestions,
  chapters,
} from "@wtfiwant/shared";
import { FormError } from "@/components/ui/form-error";
import {
  eyebrowClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/lib/styles";
import { QuestionInput } from "./question-inputs";

type CurrentQuestionProps = {
  question: AssessmentQuestion;
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
  return (
    <section className="animate-[enter_0.35s_ease-out]" key={question.id}>
      <p className={eyebrowClassName}>
        {chapters[chapterIndex].label} · {questionIndex + 1} OF{" "}
        {assessmentQuestions.length}
      </p>
      <p className="mb-5 font-[Georgia,serif] text-base text-muted italic">
        {chapters[chapterIndex].eyebrow}
      </p>
      <h1 className="mb-4 max-w-[18ch] text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] tracking-[-0.07em]">
        {question.prompt}
      </h1>
      {question.description ? (
        <p className="mb-9 max-w-[42rem] text-[1.05rem] leading-relaxed text-muted">
          {question.description}
        </p>
      ) : null}
      <QuestionInput
        question={question}
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
          Back
        </button>
        <div className="flex items-center gap-4">
          <span
            className="text-[0.7rem] font-extrabold tracking-[0.12em] text-[#557033] uppercase"
            aria-live="polite"
          >
            {saved ? "Saved" : ""}
          </span>
          <button
            className={primaryButtonClassName}
            type="button"
            disabled={saving}
            onClick={onContinue}
          >
            {saving
              ? "Saving…"
              : questionIndex === assessmentQuestions.length - 1
                ? "Make sense of this"
                : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
