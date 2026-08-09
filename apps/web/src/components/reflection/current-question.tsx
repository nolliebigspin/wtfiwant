import {
  type AssessmentQuestion,
  assessmentQuestions,
  chapters,
} from "@wtfiwant/shared";
import { FormError } from "@/components/ui/form-error";
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
    <section className="question-enter" key={question.id}>
      <p className="eyebrow">
        {chapters[chapterIndex].label} · {questionIndex + 1} OF{" "}
        {assessmentQuestions.length}
      </p>
      <p className="chapter-note">{chapters[chapterIndex].eyebrow}</p>
      <h1 className="question-title">{question.prompt}</h1>
      {question.description ? (
        <p className="question-description">{question.description}</p>
      ) : null}
      <QuestionInput
        question={question}
        value={value}
        onChange={onAnswerChange}
      />
      <FormError>{error}</FormError>
      <div className="journey-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={questionIndex === 0 || saving}
          onClick={onBack}
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className="saved-state" aria-live="polite">
            {saved ? "Saved" : ""}
          </span>
          <button
            className="primary-button"
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
