import type { Analysis } from "@wtfiwant/shared";
import { EvidenceDrawer } from "./evidence-drawer";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";

export function TensionsSection({
  tensions,
  answers,
}: {
  tensions: Analysis["tensions"];
  answers: EvidenceAnswers;
}) {
  if (tensions.length === 0) return null;

  return (
    <section className="tensions-section" aria-labelledby="tensions-title">
      <SectionHeading
        eyebrow="THE USEFUL FRICTION"
        title="Your Tensions"
        titleId="tensions-title"
        light
      >
        <p>
          Not problems to eliminate. Conditions your life may need to hold at
          the same time.
        </p>
      </SectionHeading>
      <div className="space-y-5">
        {tensions.map((tension) => (
          <article className="tension-card" key={tension.id}>
            <h3>
              <span>{tension.sideA}</span>
              <b>↔</b>
              <span>{tension.sideB}</span>
            </h3>
            <p>{tension.explanation}</p>
            <EvidenceDrawer
              ids={tension.evidenceQuestionIds}
              answers={answers}
              dark
            />
          </article>
        ))}
      </div>
    </section>
  );
}
