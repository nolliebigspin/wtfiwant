import type { Analysis } from "@wtfiwant/shared";
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
  return (
    <section className={resultSectionClassName} aria-labelledby="drivers-title">
      <SectionHeading
        eyebrow="SIGNALS, NOT SCORES"
        title="What seems to matter"
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
