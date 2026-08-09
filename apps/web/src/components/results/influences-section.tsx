import type { Analysis } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Results");
  if (influences.length === 0) return null;

  return (
    <section className={resultSectionClassName}>
      <SectionHeading
        eyebrow={t("influencesEyebrow")}
        title={t("influencesTitle")}
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
