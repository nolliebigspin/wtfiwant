import type { Analysis } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";

type StepChoicesProps = {
  steps: Analysis["firstSteps"];
  selected: number;
  onChoose: (index: number) => void;
};

export function StepChoices({ steps, selected, onChoose }: StepChoicesProps) {
  const t = useTranslations("Results");
  return (
    <div className="motion-reveal mb-16 grid grid-cols-2 gap-4 max-[800px]:grid-cols-1">
      {steps.map((candidate, index) => (
        <button
          aria-pressed={selected === index}
          className={`min-h-32 cursor-pointer rounded-2xl bg-transparent p-5 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
            selected === index
              ? "border-2 border-accent bg-accent/5 shadow-[0_10px_24px_rgb(255_79_36_/_0.09)]"
              : "border border-ink/20 hover:border-ink hover:shadow-[0_10px_24px_rgb(22_23_19_/_0.07)]"
          }`}
          type="button"
          key={candidate.direction}
          onClick={() => onChoose(index)}
        >
          <span className="mb-6 block text-[0.6rem] font-black tracking-[0.14em] text-accent-ink">
            {t("directionChoice", { number: index + 1 })}
          </span>
          <strong>{candidate.direction}</strong>
        </button>
      ))}
    </div>
  );
}
