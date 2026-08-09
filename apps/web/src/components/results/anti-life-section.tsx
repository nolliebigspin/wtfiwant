import type { Analysis } from "@wtfiwant/shared";
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
    <section className="result-section anti-life" aria-labelledby="anti-title">
      <SectionHeading
        eyebrow="A CLEAR NO"
        title="Your Anti-Life"
        titleId="anti-title"
      />
      <blockquote>{antiLife.summary}</blockquote>
      <div className="theme-list">
        {antiLife.themes.map((theme) => (
          <span key={theme}>{theme}</span>
        ))}
      </div>
      <EvidenceDrawer ids={antiLife.evidenceQuestionIds} answers={answers} />
    </section>
  );
}
