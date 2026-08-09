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

export function DriversSection({
  drivers,
  answers,
}: {
  drivers: Analysis["coreDrivers"];
  answers: EvidenceAnswers;
}) {
  const t = useTranslations("Results");
  return (
    <section className={resultSectionClassName} aria-labelledby="drivers-title">
      <SectionHeading
        eyebrow={t("driversEyebrow")}
        title={t("driversTitle")}
        titleId="drivers-title"
      />
      <div className={resultCardGridClassName}>
        {drivers.map((driver, index) => (
          <article className={resultCardClassName} key={driver.id}>
            <span className={resultCardIndexClassName}>0{index + 1}</span>
            <h3 className={resultCardTitleClassName}>{driver.name}</h3>
            <p className={resultCardCopyClassName}>{driver.explanation}</p>
            <EvidenceDrawer
              ids={driver.evidenceQuestionIds}
              answers={answers}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
