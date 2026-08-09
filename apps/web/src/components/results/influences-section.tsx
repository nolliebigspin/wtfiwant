import type { Analysis } from "@wtfiwant/shared";
import { EvidenceDrawer } from "./evidence-drawer";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";

export function InfluencesSection({
  influences,
  answers,
}: {
  influences: Analysis["externalInfluences"];
  answers: EvidenceAnswers;
}) {
  if (influences.length === 0) return null;

  return (
    <section className="result-section">
      <SectionHeading
        eyebrow="THE NOISE"
        title="What may not be entirely yours"
      />
      {influences.map((influence) => (
        <article className="influence-card" key={influence.observation}>
          <p>{influence.observation}</p>
          <EvidenceDrawer
            ids={influence.evidenceQuestionIds}
            answers={answers}
          />
        </article>
      ))}
    </section>
  );
}
