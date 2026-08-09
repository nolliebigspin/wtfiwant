import type { Analysis } from "@wtfiwant/shared";
import { EvidenceDrawer } from "./evidence-drawer";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";

export function DirectionsSection({
  directions,
  answers,
}: {
  directions: Analysis["possibleDirections"];
  answers: EvidenceAnswers;
}) {
  return (
    <section
      className="result-section directions"
      aria-labelledby="directions-title"
    >
      <SectionHeading
        eyebrow="HYPOTHESES TO TEST"
        title="Directions worth exploring"
        titleId="directions-title"
      >
        <p>
          None of these is “your perfect life.” They are places to collect
          better evidence.
        </p>
      </SectionHeading>
      <div className="direction-grid">
        {directions.map((direction, index) => (
          <article className="direction-card" key={direction.title}>
            <span className="direction-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{direction.title}</h3>
            <p>{direction.explanation}</p>
            <small>WHY IT MAY FIT</small>
            <p>{direction.whyItFits}</p>
            <EvidenceDrawer
              ids={direction.evidenceQuestionIds}
              answers={answers}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
