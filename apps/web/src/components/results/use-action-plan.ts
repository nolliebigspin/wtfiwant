"use client";

import {
  type ActionPlanInput,
  type Analysis,
  actionPlanInputSchema,
  type Locale,
  type SessionView,
} from "@wtfiwant/shared";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { trackAnalytics } from "@/lib/analytics";

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
  const t = useTranslations("Results");
  const locale = useLocale() as Locale;
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
    if (!actionPlanInputSchema.safeParse(form).success) {
      setError(t("incompletePlan"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      trackAnalytics("action_plan_saved", "result", locale);
      setDone(true);
    } catch {
      setError(t("planError"));
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
