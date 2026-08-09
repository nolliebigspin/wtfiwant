import {
  type QuestionInputProps,
  questionInputClassName,
} from "./question-input.types";

export function ChoiceQuestion({
  question,
  value,
  onChange,
}: QuestionInputProps) {
  const selected =
    question.type === "multi_choice" && Array.isArray(value)
      ? (value as string[])
      : [];
  const single = typeof value === "string" ? value : "";
  const options = "options" in question ? question.options : [];
  const other =
    question.type === "multi_choice"
      ? (selected.find((item) => !question.options.includes(item)) ?? "")
      : "";

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">{question.prompt}</legend>
      {options.map((option) => {
        const checked =
          question.type === "multi_choice"
            ? selected.includes(option)
            : single === option;

        return (
          <label
            key={option}
            className={`choice-card ${checked ? "choice-card-selected" : ""}`}
          >
            <input
              type={question.type === "multi_choice" ? "checkbox" : "radio"}
              name={question.id}
              checked={checked}
              onChange={() => {
                if (question.type === "single_choice") onChange(option);
                else
                  onChange(
                    checked
                      ? selected.filter((item) => item !== option)
                      : [...selected, option],
                  );
              }}
            />
            <span>{option}</span>
          </label>
        );
      })}
      {question.type === "multi_choice" && question.allowOther ? (
        <label className="sm:col-span-2">
          <span className="field-label">{question.otherLabel}</span>
          <input
            className={questionInputClassName}
            value={other}
            onChange={(event) => {
              const withoutOther = selected.filter((item) =>
                question.options.includes(item),
              );
              onChange(
                event.target.value
                  ? [...withoutOther, event.target.value]
                  : withoutOther,
              );
            }}
            placeholder={question.otherPlaceholder}
          />
        </label>
      ) : null}
    </fieldset>
  );
}
