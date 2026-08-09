import type { Analysis } from "@wtfiwant/shared";
import { resultSectionClassName } from "@/lib/styles";
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
    <section className={resultSectionClassName}>
      <SectionHeading
        eyebrow="THE NOISE"
        title="What may not be entirely yours"
      />
      {influences.map((influence) => (
        <article
          className="max-w-[50rem] border-l-[3px] border-accent pl-8 text-xl leading-normal"
          key={influence.observation}
        >
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
