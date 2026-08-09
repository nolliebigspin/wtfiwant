"use client";

import type { ActionPlanInput, Analysis, SessionView } from "@wtfiwant/shared";
import { type FormEvent, type ReactNode, useState } from "react";
import { FormError } from "@/components/ui/form-error";
import { EvidenceDrawer } from "./evidence-drawer";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";

const obstacles = [
  "I'm tired after work",
  "Social media",
  "I overthink things",
  "I don't know where to start",
  "I'm afraid I'll fail",
  "I always postpone it",
  "Other",
];

type ActionPlanBuilderProps = {
  sessionId: string;
  steps: Analysis["firstSteps"];
  savedPlan: SessionView["actionPlan"];
  answers: EvidenceAnswers;
  onSave: (input: ActionPlanInput) => Promise<void>;
};

export function ActionPlanBuilder({
  sessionId,
  steps,
  savedPlan,
  answers,
  onSave,
}: ActionPlanBuilderProps) {
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

  return (
    <section className="action-builder" id={`start-${sessionId}`}>
      <SectionHeading
        eyebrow="DIRECTION → EXPERIMENT → NOW"
        title="Make it real enough to begin."
      >
        <p>
          You do not need to solve your life. Pick one direction and run a
          small, reversible experiment.
        </p>
      </SectionHeading>
      <div className="step-choices">
        {steps.map((candidate, index) => (
          <button
            className={selected === index ? "selected" : ""}
            type="button"
            key={candidate.direction}
            onClick={() => chooseStep(index)}
          >
            <span>DIRECTION {index + 1}</span>
            <strong>{candidate.direction}</strong>
          </button>
        ))}
      </div>
      <EvidenceDrawer ids={step.evidenceQuestionIds} answers={answers} />
      <form onSubmit={save} className="plan-form">
        <PlanField
          number="01"
          label="Direction"
          hint="A broad direction to explore"
        >
          <input
            aria-label="Direction"
            value={form.direction}
            onChange={(event) => update("direction", event.target.value)}
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
            onChange={(event) => update("experiment", event.target.value)}
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
            onChange={(event) => update("immediateAction", event.target.value)}
          />
        </PlanField>
        <div className="intention-card">
          <p className="eyebrow">
            MAKE A PLAN FOR THE MOMENT MOTIVATION DISAPPEARS
          </p>
          <label>
            <span>What's most likely to stop you?</span>
            <select
              aria-label="What's most likely to stop you?"
              value={form.obstacle}
              onChange={(event) => update("obstacle", event.target.value)}
            >
              <option value="">Choose the honest obstacle</option>
              {obstacles.map((obstacle) => (
                <option key={obstacle}>{obstacle}</option>
              ))}
            </select>
          </label>
          <div className="if-then">
            <label>
              <span>If</span>
              <textarea
                aria-label="If"
                value={form.ifCondition}
                onChange={(event) => update("ifCondition", event.target.value)}
                placeholder="I get home and automatically open Instagram…"
              />
            </label>
            <div className="then-arrow">→</div>
            <label>
              <span>Then</span>
              <textarea
                aria-label="Then"
                value={form.thenAction}
                onChange={(event) => update("thenAction", event.target.value)}
                placeholder="I'll first spend ten minutes on the next step…"
              />
            </label>
          </div>
        </div>
        <FormError>{error}</FormError>
        <div className="start-submit">
          <p>Motivation may show up after you begin. Make beginning smaller.</p>
          <button className="start-button" disabled={saving} type="submit">
            {saving ? "Starting…" : "Start now"}
          </button>
          {done ? (
            <strong className="started-message">
              Started. Not solved — started.
            </strong>
          ) : null}
        </div>
      </form>
    </section>
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
