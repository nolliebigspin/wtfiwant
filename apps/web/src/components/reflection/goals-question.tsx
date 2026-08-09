import {
  type GoalsAnswer,
  getGermanAssessmentTranslation,
  goalPrompts,
  maxGoals,
} from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import {
  eyebrowClassName,
  questionCardClassName,
  textButtonClassName,
} from "@/lib/styles";
import {
  type AnswerInputProps,
  questionInputClassName,
} from "./question-input.types";

type Goal = GoalsAnswer["goals"][number];

export function GoalsQuestion({ value, onChange, locale }: AnswerInputProps) {
  const t = useTranslations("Reflection");
  const prompts =
    locale === "de"
      ? getGermanAssessmentTranslation().goalPrompts
      : goalPrompts;
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
        <section className={questionCardClassName} key={`goal-${index + 1}`}>
          <div className="flex items-start justify-between">
            <p className={eyebrowClassName}>
              {t("possibility", { number: index + 1 })}
            </p>
            {index > 0 ? (
              <button
                className={textButtonClassName}
                type="button"
                onClick={() =>
                  onChange({
                    goals: goals.filter((_, goalIndex) => goalIndex !== index),
                  })
                }
              >
                {t("remove")}
              </button>
            ) : null}
          </div>
          <label>
            <span className="mb-2 block text-xs font-extrabold">
              {prompts.goal}
            </span>
            <input
              className={questionInputClassName}
              value={goal.goal}
              onChange={(event) => update(index, "goal", event.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-extrabold">
              {prompts.why}
            </span>
            <textarea
              className={`${questionInputClassName} min-h-28`}
              value={goal.why}
              onChange={(event) => update(index, "why", event.target.value)}
            />
          </label>
        </section>
      ))}
      {goals.length < maxGoals ? (
        <button
          className={textButtonClassName}
          type="button"
          onClick={() => onChange({ goals: [...goals, { goal: "", why: "" }] })}
        >
          {t("addGoal")}
        </button>
      ) : null}
    </div>
  );
}
