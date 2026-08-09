import type { Analysis } from "@wtfiwant/shared";
import { resultSectionClassName } from "@/lib/styles";
import { EvidenceDrawer } from "./evidence-drawer";
import type { EvidenceAnswers } from "./results.types";
import { SectionHeading } from "./section-heading";

export function AntiLifeSection({
  antiLife,
  answers,
}: {
  antiLife: Analysis["antiLife"];
  answers: EvidenceAnswers;
}) {
  return (
    <section
      className={`${resultSectionClassName} bg-acid`}
      aria-labelledby="anti-title"
    >
      <SectionHeading
        eyebrow="A CLEAR NO"
        title="Your Anti-Life"
        titleId="anti-title"
      />
      <blockquote className="my-16 max-w-[52rem] font-[Georgia,serif] text-[clamp(1.7rem,3.5vw,3.8rem)] leading-tight">
        {antiLife.summary}
      </blockquote>
      <div className="flex flex-wrap gap-3">
        {antiLife.themes.map((theme) => (
          <span
            className="rounded-full border border-ink px-4 py-2.5 text-[0.7rem] font-extrabold"
            key={theme}
          >
            {theme}
          </span>
        ))}
      </div>
      <EvidenceDrawer ids={antiLife.evidenceQuestionIds} answers={answers} />
    </section>
  );
}
