import type { Analysis } from "@wtfiwant/shared";
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
    <section className="result-section" aria-labelledby="goals-title">
      <SectionHeading
        eyebrow="BENEATH THE STATED GOAL"
        title="What you may be asking the goal to provide"
        titleId="goals-title"
      />
      <div className="direction-grid">
        {goals.map((goal) => (
          <article className="direction-card" key={goal.originalGoal}>
            <span className="direction-index">YOU SAID</span>
            <h3>{goal.originalGoal}</h3>
            <small>POSSIBLE UNDERLYING NEED</small>
            <p>{goal.possibleUnderlyingNeed}</p>
            <p>{goal.interpretation}</p>
            <EvidenceDrawer ids={goal.evidenceQuestionIds} answers={answers} />
          </article>
        ))}
      </div>
    </section>
  );
}
