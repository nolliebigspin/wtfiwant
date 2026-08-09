import {
  getGermanAssessmentTranslation,
  type TradeoffAnswer,
  tradeoffPairs,
  tradeoffScaleLabels,
} from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { tradeoffCardClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { AnswerInputProps } from "./question-input.types";

export function TradeoffsQuestion({
  value,
  onChange,
  locale,
}: AnswerInputProps) {
  const t = useTranslations("Reflection");
  const german = locale === "de" ? getGermanAssessmentTranslation() : null;
  const pairs = german?.tradeoffPairs ?? tradeoffPairs;
  const labels = german?.tradeoffScaleLabels ?? tradeoffScaleLabels;
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
    <div className="motion-list space-y-6">
      {pairs.map(([left, right], index) => (
        <fieldset className={tradeoffCardClassName} key={left}>
          <legend className="sr-only">{t("versus", { left, right })}</legend>
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-semibold sm:text-base">
            <span>{left}</span>
            <span className="text-ink/35">↔</span>
            <span className="text-right">{right}</span>
          </div>
          <input
            className="motion-range w-full accent-accent"
            type="range"
            min="-2"
            max="2"
            step="1"
            value={choices[index]}
            aria-label={t("versus", { left, right })}
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
            <span>{labels.left}</span>
            <span>{labels.middle}</span>
            <span>{labels.right}</span>
          </div>
          <p
            className={cn(
              "mt-3 text-xs font-bold",
              touched[index] ? "text-ink/50" : "text-accent-ink",
            )}
          >
            {touched[index] ? labels.chosen : labels.untouched}
          </p>
        </fieldset>
      ))}
    </div>
  );
}
