import {
  type TradeoffAnswer,
  tradeoffPairs,
  tradeoffScaleLabels,
} from "@wtfiwant/shared";
import { questionCardClassName } from "@/lib/styles";
import type { AnswerInputProps } from "./question-input.types";

export function TradeoffsQuestion({ value, onChange }: AnswerInputProps) {
  const record =
    value && typeof value === "object"
      ? (value as Partial<TradeoffAnswer>)
      : {};
  const choices =
    record.choices?.length === tradeoffPairs.length
      ? record.choices
      : tradeoffPairs.map(() => 0);
  const touched =
    record.touched?.length === tradeoffPairs.length
      ? record.touched
      : tradeoffPairs.map(() => false);
  const markTouched = (index: number) =>
    onChange({
      choices,
      touched: touched.map((item, itemIndex) =>
        itemIndex === index ? true : item,
      ),
    });

  return (
    <div className="space-y-6">
      {tradeoffPairs.map(([left, right], index) => (
        <fieldset className={`${questionCardClassName} p-6`} key={left}>
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
            onPointerDown={() => markTouched(index)}
            onKeyDown={() => markTouched(index)}
            onChange={(event) =>
              onChange({
                choices: choices.map((choice, choiceIndex) =>
                  choiceIndex === index ? Number(event.target.value) : choice,
                ),
                touched: touched.map((item, itemIndex) =>
                  itemIndex === index ? true : item,
                ),
              })
            }
          />
          <div className="mt-2 flex justify-between text-xs uppercase tracking-widest text-ink/40">
            <span>{tradeoffScaleLabels.left}</span>
            <span>{tradeoffScaleLabels.middle}</span>
            <span>{tradeoffScaleLabels.right}</span>
          </div>
          <p
            className={`mt-3 text-xs font-bold ${touched[index] ? "text-ink/50" : "text-accent-ink"}`}
          >
            {touched[index]
              ? tradeoffScaleLabels.chosen
              : tradeoffScaleLabels.untouched}
          </p>
        </fieldset>
      ))}
    </div>
  );
}
