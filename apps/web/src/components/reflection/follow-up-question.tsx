import { FormError } from "@/components/ui/form-error";

type FollowUpQuestionProps = {
  question: string;
  response: string;
  error: string | null;
  saving: boolean;
  onResponseChange: (response: string) => void;
  onSkip: () => void;
  onSubmit: () => void;
};

export function FollowUpQuestion({
  question,
  response,
  error,
  saving,
  onResponseChange,
  onSkip,
  onSubmit,
}: FollowUpQuestionProps) {
  return (
    <section className="question-enter">
      <p className="eyebrow">ONE LAST CLARIFICATION</p>
      <h1 className="question-title">{question}</h1>
      <p className="question-description">
        This is optional. A useful distinction is enough.
      </p>
      <textarea
        className="answer-textarea"
        value={response}
        aria-label={question}
        onChange={(event) => onResponseChange(event.target.value)}
      />
      <FormError>{error}</FormError>
      <div className="journey-actions">
        <button className="secondary-button" type="button" onClick={onSkip}>
          Skip
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? "Saving…" : "See my Compass"}
        </button>
      </div>
    </section>
  );
}
