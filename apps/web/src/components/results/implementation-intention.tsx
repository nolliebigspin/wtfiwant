import type { ActionPlanInput } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Select } from "@/components/ui/select";
import { eyebrowClassName, fieldControlClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

type ImplementationIntentionProps = {
  form: ActionPlanInput;
  onChange: (key: keyof ActionPlanInput, value: string) => void;
};

export function ImplementationIntention({
  form,
  onChange,
}: ImplementationIntentionProps) {
  const t = useTranslations("Results");
  const obstacles = t.raw("obstacles") as string[];
  const obstacleLabelId = useId();
  return (
    <div className="motion-reveal motion-reveal-scale mt-12 rounded-[1.3rem] border border-ink/20 p-[clamp(1.2rem,4vw,3rem)]">
      <p className={eyebrowClassName}>{t("motivation")}</p>
      <div>
        <span className="mb-3 block font-extrabold" id={obstacleLabelId}>
          {t("obstacleQuestion")}
        </span>
        <Select
          ariaLabelledBy={obstacleLabelId}
          value={form.obstacle}
          placeholder={t("chooseObstacle")}
          options={obstacles.map((obstacle) => ({
            label: obstacle,
            value: obstacle,
          }))}
          onValueChange={(obstacle) => onChange("obstacle", obstacle)}
        />
      </div>
      <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[800px]:grid-cols-1">
        <label>
          <span className="mb-3 block font-extrabold">{t("if")}</span>
          <textarea
            className={cn(fieldControlClassName, "min-h-32 resize-y")}
            aria-label={t("if")}
            value={form.ifCondition}
            onChange={(event) => onChange("ifCondition", event.target.value)}
            placeholder={t("ifPlaceholder")}
          />
        </label>
        <div className="text-3xl text-accent transition-transform duration-300 max-[800px]:justify-self-center max-[800px]:rotate-90">
          →
        </div>
        <label>
          <span className="mb-3 block font-extrabold">{t("then")}</span>
          <textarea
            className={cn(fieldControlClassName, "min-h-32 resize-y")}
            aria-label={t("then")}
            value={form.thenAction}
            onChange={(event) => onChange("thenAction", event.target.value)}
            placeholder={t("thenPlaceholder")}
          />
        </label>
      </div>
    </div>
  );
}
