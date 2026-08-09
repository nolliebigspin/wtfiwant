import {
  customLifePrompt,
  type ThreeLivesAnswer,
  threeLifePrompts,
  threeLives,
} from "@wtfiwant/shared";
import { eyebrowClassName, questionCardClassName } from "@/lib/styles";
import {
  type AnswerInputProps,
  questionInputClassName,
} from "./question-input.types";

type LifeResponse = ThreeLivesAnswer["lives"][number];

export function ThreeLivesQuestion({ value, onChange }: AnswerInputProps) {
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
        <section className={questionCardClassName} key={life.id}>
          <p className={eyebrowClassName}>{life.name}</p>
          <p className="mb-5 text-ink/65">{life.description}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-extrabold">
                {threeLifePrompts.attracts}
              </span>
              <textarea
                className={`${questionInputClassName} min-h-28`}
                value={lives[index].attracts}
                onChange={(event) =>
                  update(life.id, "attracts", event.target.value)
                }
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-extrabold">
                {threeLifePrompts.repels}
              </span>
              <textarea
                className={`${questionInputClassName} min-h-28`}
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
        <span className="mb-2 block text-xs font-extrabold">
          {customLifePrompt}{" "}
          <span className="font-normal text-muted">optional</span>
        </span>
        <textarea
          className={`${questionInputClassName} min-h-28`}
          value={record.customLife ?? ""}
          onChange={(event) =>
            onChange({ ...record, lives, customLife: event.target.value })
          }
        />
      </label>
    </div>
  );
}
