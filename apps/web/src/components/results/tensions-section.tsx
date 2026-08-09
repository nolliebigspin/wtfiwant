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
    <section
      className="bg-ink px-[clamp(1.2rem,12vw,13rem)] py-[clamp(5rem,9vw,9rem)] text-white"
      aria-labelledby="tensions-title"
    >
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
          <article
            className="rounded-[1.2rem] border border-white/18 p-[clamp(1.4rem,4vw,3rem)]"
            key={tension.id}
          >
            <h3 className="m-0 grid grid-cols-[1fr_auto_1fr] gap-4 text-[clamp(2rem,5vw,5rem)] tracking-[-0.065em] max-[800px]:grid-cols-1">
              <span>{tension.sideA}</span>
              <b className="text-acid max-[800px]:w-fit max-[800px]:rotate-90">
                ↔
              </b>
              <span className="text-right max-[800px]:text-left">
                {tension.sideB}
              </span>
            </h3>
            <p className="max-w-3xl leading-[1.65] text-white/70">
              {tension.explanation}
            </p>
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
