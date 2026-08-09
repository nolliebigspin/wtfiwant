import type { ActionPlanInput } from "@wtfiwant/shared";
import type { ReactNode } from "react";
import { fieldControlClassName } from "@/lib/styles";

type ActionPlanFieldsProps = {
  form: ActionPlanInput;
  onChange: (key: keyof ActionPlanInput, value: string) => void;
};

export function ActionPlanFields({ form, onChange }: ActionPlanFieldsProps) {
  return (
    <>
      <PlanField
        number="01"
        label="Direction"
        hint="A broad direction to explore"
      >
        <input
          className={fieldControlClassName}
          aria-label="Direction"
          value={form.direction}
          onChange={(event) => onChange("direction", event.target.value)}
        />
      </PlanField>
      <PlanField
        number="02"
        label="Experiment"
        hint="A reversible real-world test"
      >
        <textarea
          className={`${fieldControlClassName} min-h-24 resize-y`}
          aria-label="Experiment"
          value={form.experiment}
          onChange={(event) => onChange("experiment", event.target.value)}
        />
      </PlanField>
      <PlanField
        number="03"
        label="Now"
        hint="Something small enough for the next 24 hours"
      >
        <textarea
          className={`${fieldControlClassName} min-h-24 resize-y`}
          aria-label="Now"
          value={form.immediateAction}
          onChange={(event) => onChange("immediateAction", event.target.value)}
        />
      </PlanField>
    </>
  );
}

function PlanField({
  number,
  label,
  hint,
  children,
}: {
  number: string;
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[3rem_11rem_1fr] items-start gap-4 border-t border-ink/18 py-8 max-[800px]:grid-cols-[2rem_1fr] max-[800px]:[&>input]:col-span-full max-[800px]:[&>textarea]:col-span-full">
      <span className="text-[0.7rem] font-black text-accent-ink">{number}</span>
      <span>
        <strong className="block text-xl">{label}</strong>
        <small className="mt-1.5 block text-muted">{hint}</small>
      </span>
      {children}
    </div>
  );
}
