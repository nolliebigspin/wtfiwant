import {
  type AnswerInputProps,
  questionInputClassName,
} from "./question-input.types";

type LongTextQuestionProps = AnswerInputProps & {
  placeholder?: string;
  label: string;
};

export function LongTextQuestion({
  value,
  onChange,
  placeholder,
  label,
}: LongTextQuestionProps) {
  return (
    <textarea
      className={`${questionInputClassName} min-h-44 resize-y`}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
  );
}
