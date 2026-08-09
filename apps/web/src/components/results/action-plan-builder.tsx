"use client";

import type { ActionPlanInput, Analysis, SessionView } from "@wtfiwant/shared";
import { FormError } from "@/components/ui/form-error";
import { ActionPlanFields } from "./action-plan-fields";
import { ActionPlanSubmit } from "./action-plan-submit";
import { EvidenceDrawer } from "./evidence-drawer";
import { ImplementationIntention } from "./implementation-intention";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";
import { StepChoices } from "./step-choices";
import { useActionPlan } from "./use-action-plan";

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
  const plan = useActionPlan({ steps, savedPlan, onSave });

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
      <StepChoices
        steps={steps}
        selected={plan.selected}
        onChoose={plan.chooseStep}
      />
      <EvidenceDrawer ids={plan.step.evidenceQuestionIds} answers={answers} />
      <form onSubmit={plan.save} className="plan-form">
        <ActionPlanFields form={plan.form} onChange={plan.update} />
        <ImplementationIntention form={plan.form} onChange={plan.update} />
        <FormError>{plan.error}</FormError>
        <ActionPlanSubmit saving={plan.saving} done={plan.done} />
      </form>
    </section>
  );
}
