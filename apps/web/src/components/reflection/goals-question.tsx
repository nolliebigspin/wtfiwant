import { type GoalsAnswer, goalPrompts } from "@wtfiwant/shared";
import {
  type AnswerInputProps,
  questionInputClassName,
} from "./question-input.types";

type Goal = GoalsAnswer["goals"][number];

export function GoalsQuestion({ value, onChange }: AnswerInputProps) {
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
            <span className="field-label">{goalPrompts.goal}</span>
            <input
              className={questionInputClassName}
              value={goal.goal}
              onChange={(event) => update(index, "goal", event.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="field-label">{goalPrompts.why}</span>
            <textarea
              className={`${questionInputClassName} min-h-28`}
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
