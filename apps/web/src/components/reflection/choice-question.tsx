import {
  getLocalizedOptionLabel,
  getLocalizedQuestion,
} from "@/lib/assessment-i18n";
import {
  type QuestionInputProps,
  questionInputClassName,
} from "./question-input.types";

export function ChoiceQuestion({
  question,
  locale,
  value,
  onChange,
}: QuestionInputProps) {
  const localizedQuestion = getLocalizedQuestion(question, locale);
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
      <legend className="sr-only">{localizedQuestion.prompt}</legend>
      {options.map((option, optionIndex) => {
        const checked =
          question.type === "multi_choice"
            ? selected.includes(option)
            : single === option;

        return (
          <label
            key={option}
            className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-colors hover:border-ink ${
              checked
                ? "border-accent bg-accent/6"
                : "border-ink/16 bg-transparent"
            }`}
          >
            <input
              className="size-[1.1rem] accent-accent"
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
            <span>
              {getLocalizedOptionLabel(question, optionIndex, locale)}
            </span>
          </label>
        );
      })}
      {question.type === "multi_choice" && question.allowOther ? (
        <label className="sm:col-span-2">
          <span className="mb-2 block text-xs font-extrabold">
            {localizedQuestion.type === "multi_choice"
              ? localizedQuestion.otherLabel
              : question.otherLabel}
          </span>
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
            placeholder={
              localizedQuestion.type === "multi_choice"
                ? localizedQuestion.otherPlaceholder
                : question.otherPlaceholder
            }
          />
        </label>
      ) : null}
    </fieldset>
  );
}
