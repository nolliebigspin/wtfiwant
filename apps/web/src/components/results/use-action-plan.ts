"use client";

import type { ActionPlanInput, Analysis, SessionView } from "@wtfiwant/shared";
import { type FormEvent, useState } from "react";

type UseActionPlanOptions = {
  steps: Analysis["firstSteps"];
  savedPlan: SessionView["actionPlan"];
  onSave: (input: ActionPlanInput) => Promise<void>;
};

export function useActionPlan({
  steps,
  savedPlan,
  onSave,
}: UseActionPlanOptions) {
  const initialIndex = Math.max(
    0,
    steps.findIndex((step) => step.direction === savedPlan?.direction),
  );
  const [selected, setSelected] = useState(initialIndex);
  const step = steps[selected] ?? steps[0];
  const [form, setForm] = useState<ActionPlanInput>(
    () =>
      savedPlan ?? {
        direction: step.direction,
        experiment: step.experiment,
        immediateAction: step.immediateAction,
        obstacle: "",
        ifCondition: "",
        thenAction: "",
      },
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof ActionPlanInput, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const chooseStep = (index: number) => {
    setSelected(index);
    setForm((current) => ({
      ...current,
      direction: steps[index].direction,
      experiment: steps[index].experiment,
      immediateAction: steps[index].immediateAction,
    }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim())) {
      setError("Make each part concrete before you start.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setDone(true);
    } catch {
      setError("That didn't save. Nothing was lost — try again.");
    } finally {
      setSaving(false);
    }
  };

  return {
    chooseStep,
    done,
    error,
    form,
    save,
    saving,
    selected,
    step,
    update,
  };
}
