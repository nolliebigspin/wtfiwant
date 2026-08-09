import type { Analysis } from "@wtfiwant/shared";
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
    <section
      className="result-section compass-grid"
      aria-labelledby="drivers-title"
    >
      <SectionHeading
        eyebrow="SIGNALS, NOT SCORES"
        title="What seems to matter"
        titleId="drivers-title"
      />
      <div className="driver-grid">
        {drivers.map((driver, index) => (
          <article className="driver-card" key={driver.id}>
            <span className="card-number">0{index + 1}</span>
            <h3>{driver.name}</h3>
            <p>{driver.explanation}</p>
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
