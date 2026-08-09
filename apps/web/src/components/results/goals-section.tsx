import type { Analysis } from "@wtfiwant/shared";
import {
  resultCardClassName,
  resultCardCopyClassName,
  resultCardGridClassName,
  resultCardIndexClassName,
  resultCardTitleClassName,
  resultSectionClassName,
} from "@/lib/styles";
import { EvidenceDrawer } from "./evidence-drawer";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";

export function GoalsSection({
  goals,
  answers,
}: {
  goals: Analysis["goals"];
  answers: EvidenceAnswers;
}) {
  if (goals.length === 0) return null;

  return (
    <section className={resultSectionClassName} aria-labelledby="goals-title">
      <SectionHeading
        eyebrow="BENEATH THE STATED GOAL"
        title="What you may be asking the goal to provide"
        titleId="goals-title"
      />
      <div className={resultCardGridClassName}>
        {goals.map((goal) => (
          <article className={resultCardClassName} key={goal.originalGoal}>
            <span className={resultCardIndexClassName}>YOU SAID</span>
            <h3 className={resultCardTitleClassName}>{goal.originalGoal}</h3>
            <small className="mt-8 block text-[0.6rem] font-black tracking-[0.15em] text-accent-ink">
              POSSIBLE UNDERLYING NEED
            </small>
            <p className={resultCardCopyClassName}>
              {goal.possibleUnderlyingNeed}
            </p>
            <p className={resultCardCopyClassName}>{goal.interpretation}</p>
            <EvidenceDrawer ids={goal.evidenceQuestionIds} answers={answers} />
          </article>
        ))}
      </div>
    </section>
  );
}
