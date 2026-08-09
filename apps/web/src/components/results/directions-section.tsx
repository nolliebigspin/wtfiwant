import type { Analysis } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
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

export function DirectionsSection({
  directions,
  answers,
}: {
  directions: Analysis["possibleDirections"];
  answers: EvidenceAnswers;
}) {
  const t = useTranslations("Results");
  return (
    <section
      className={resultSectionClassName}
      aria-labelledby="directions-title"
    >
      <SectionHeading
        eyebrow={t("directionsEyebrow")}
        title={t("directionsTitle")}
        titleId="directions-title"
      >
        <p>{t("directionsCopy")}</p>
      </SectionHeading>
      <div className={resultCardGridClassName}>
        {directions.map((direction, index) => (
          <article className={resultCardClassName} key={direction.title}>
            <span className={resultCardIndexClassName}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className={resultCardTitleClassName}>{direction.title}</h3>
            <p className={resultCardCopyClassName}>{direction.explanation}</p>
            <small className="mt-8 block text-[0.6rem] font-black tracking-[0.15em] text-accent-ink">
              {t("whyFit")}
            </small>
            <p className={resultCardCopyClassName}>{direction.whyItFits}</p>
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
