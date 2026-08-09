import type { ActionPlanInput } from "@wtfiwant/shared";
import type { ReactNode } from "react";

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
    <div className="plan-field">
      <span className="plan-number">{number}</span>
      <span className="plan-label">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      {children}
    </div>
  );
}
