"use client";

import {
  type AssessmentQuestion,
  threeLives,
  tradeoffPairs,
} from "@wtfiwant/shared";

type QuestionInputProps = {
  question: AssessmentQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
};

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-paper px-5 py-4 text-lg leading-relaxed outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function LongText({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`${inputClass} min-h-44 resize-y`}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

function Choices({ question, value, onChange }: QuestionInputProps) {
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
      <legend className="sr-only">Choose an answer</legend>
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
          <span className="field-label">Something else</span>
          <input
            className={inputClass}
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
            placeholder="What else is taking your energy?"
          />
        </label>
      ) : null}
    </fieldset>
  );
}

type Memory = {
  story: string;
  with: string;
  where: string;
  doing: string;
  special: string;
};
const blankMemory = (): Memory => ({
  story: "",
  with: "",
  where: "",
  doing: "",
  special: "",
});

function Memories({ value, onChange }: Omit<QuestionInputProps, "question">) {
  const record =
    value && typeof value === "object"
      ? (value as { memories?: Memory[] })
      : {};
  const memories = record.memories?.length ? record.memories : [blankMemory()];
  const update = (index: number, key: keyof Memory, next: string) => {
    const updated = memories.map((memory, memoryIndex) =>
      memoryIndex === index ? { ...memory, [key]: next } : memory,
    );
    onChange({ memories: updated });
  };
  return (
    <div className="space-y-5">
      {memories.map((memory, index) => (
        <section className="memory-card" key={`memory-${index + 1}`}>
          <p className="eyebrow">Moment {index + 1}</p>
          <textarea
            className={`${inputClass} min-h-32`}
            value={memory.story}
            onChange={(event) => update(index, "story", event.target.value)}
            placeholder="Tell the story. What happened?"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["with", "Who were you with?"],
                ["where", "Where were you?"],
                ["doing", "What were you doing?"],
                ["special", "What made it special?"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <span className="field-label">
                  {label} <span>optional</span>
                </span>
                <input
                  className={inputClass}
                  value={memory[key]}
                  onChange={(event) => update(index, key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>
      ))}
      {memories.length < 3 ? (
        <button
          className="text-button"
          type="button"
          onClick={() => onChange({ memories: [...memories, blankMemory()] })}
        >
          + Add another moment
        </button>
      ) : null}
    </div>
  );
}

type LifeResponse = { id: string; attracts: string; repels: string };
function ThreeLives({ value, onChange }: Omit<QuestionInputProps, "question">) {
  const record =
    value && typeof value === "object"
      ? (value as { lives?: LifeResponse[]; customLife?: string })
      : {};
  const lives = threeLives.map(
    (life) =>
      record.lives?.find((item) => item.id === life.id) ?? {
        id: life.id,
        attracts: "",
        repels: "",
      },
  );
  const update = (id: string, key: "attracts" | "repels", next: string) =>
    onChange({
      ...record,
      lives: lives.map((life) =>
        life.id === id ? { ...life, [key]: next } : life,
      ),
    });
  return (
    <div className="space-y-5">
      {threeLives.map((life, index) => (
        <section className="life-card" key={life.id}>
          <p className="eyebrow">{life.name}</p>
          <p className="mb-5 text-ink/65">{life.description}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">What attracts you?</span>
              <textarea
                className={`${inputClass} min-h-28`}
                value={lives[index].attracts}
                onChange={(event) =>
                  update(life.id, "attracts", event.target.value)
                }
              />
            </label>
            <label>
              <span className="field-label">What would you hate?</span>
              <textarea
                className={`${inputClass} min-h-28`}
                value={lives[index].repels}
                onChange={(event) =>
                  update(life.id, "repels", event.target.value)
                }
              />
            </label>
          </div>
        </section>
      ))}
      <label className="block">
        <span className="field-label">
          None of these? Describe another life <span>optional</span>
        </span>
        <textarea
          className={`${inputClass} min-h-28`}
          value={record.customLife ?? ""}
          onChange={(event) =>
            onChange({ ...record, lives, customLife: event.target.value })
          }
        />
      </label>
    </div>
  );
}

function Tradeoffs({ value, onChange }: Omit<QuestionInputProps, "question">) {
  const record =
    value && typeof value === "object" ? (value as { choices?: number[] }) : {};
  const choices =
    record.choices?.length === tradeoffPairs.length
      ? record.choices
      : tradeoffPairs.map(() => 0);
  return (
    <div className="space-y-6">
      {tradeoffPairs.map(([left, right], index) => (
        <fieldset className="tradeoff-card" key={left}>
          <legend className="sr-only">
            {left} versus {right}
          </legend>
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-semibold sm:text-base">
            <span>{left}</span>
            <span className="text-ink/35">↔</span>
            <span className="text-right">{right}</span>
          </div>
          <input
            className="w-full accent-[var(--accent)]"
            type="range"
            min="-2"
            max="2"
            step="1"
            value={choices[index]}
            aria-label={`${left} versus ${right}`}
            onChange={(event) =>
              onChange({
                choices: choices.map((choice, choiceIndex) =>
                  choiceIndex === index ? Number(event.target.value) : choice,
                ),
              })
            }
          />
          <div className="mt-2 flex justify-between text-xs uppercase tracking-widest text-ink/40">
            <span>lean left</span>
            <span>middle</span>
            <span>lean right</span>
          </div>
        </fieldset>
      ))}
    </div>
  );
}

type Goal = { goal: string; why: string };
function Goals({ value, onChange }: Omit<QuestionInputProps, "question">) {
  const record =
    value && typeof value === "object" ? (value as { goals?: Goal[] }) : {};
  const goals = record.goals?.length ? record.goals : [{ goal: "", why: "" }];
  const update = (index: number, key: keyof Goal, next: string) =>
    onChange({
      goals: goals.map((goal, goalIndex) =>
        goalIndex === index ? { ...goal, [key]: next } : goal,
      ),
    });
  return (
    <div className="space-y-5">
      {goals.map((goal, index) => (
        <section className="goal-card" key={`goal-${index + 1}`}>
          <div className="flex items-start justify-between">
            <p className="eyebrow">Possibility {index + 1}</p>
            {index > 0 ? (
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  onChange({
                    goals: goals.filter((_, goalIndex) => goalIndex !== index),
                  })
                }
              >
                Remove
              </button>
            ) : null}
          </div>
          <label>
            <span className="field-label">What do you think you want?</span>
            <input
              className={inputClass}
              value={goal.goal}
              onChange={(event) => update(index, "goal", event.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="field-label">Why? What would that give you?</span>
            <textarea
              className={`${inputClass} min-h-28`}
              value={goal.why}
              onChange={(event) => update(index, "why", event.target.value)}
            />
          </label>
        </section>
      ))}
      {goals.length < 3 ? (
        <button
          className="text-button"
          type="button"
          onClick={() => onChange({ goals: [...goals, { goal: "", why: "" }] })}
        >
          + Add another thing
        </button>
      ) : null}
    </div>
  );
}

export function QuestionInput(props: QuestionInputProps) {
  switch (props.question.type) {
    case "long_text":
      return (
        <LongText
          value={props.value}
          onChange={props.onChange}
          placeholder={props.question.placeholder}
        />
      );
    case "multi_choice":
    case "single_choice":
      return <Choices {...props} />;
    case "memories":
      return <Memories value={props.value} onChange={props.onChange} />;
    case "three_lives":
      return <ThreeLives value={props.value} onChange={props.onChange} />;
    case "tradeoffs":
      return <Tradeoffs value={props.value} onChange={props.onChange} />;
    case "goals":
      return <Goals value={props.value} onChange={props.onChange} />;
  }
}
