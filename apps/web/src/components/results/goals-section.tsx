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

export function GoalsSection({
  goals,
  answers,
}: {
  goals: Analysis["goals"];
  answers: EvidenceAnswers;
}) {
  const t = useTranslations("Results");
  if (goals.length === 0) return null;

  return (
    <section className={resultSectionClassName} aria-labelledby="goals-title">
      <SectionHeading
        eyebrow={t("goalsEyebrow")}
        title={t("goalsTitle")}
        titleId="goals-title"
      />
      <div className={resultCardGridClassName}>
        {goals.map((goal) => (
          <article className={resultCardClassName} key={goal.originalGoal}>
            <span className={resultCardIndexClassName}>{t("youSaid")}</span>
            <h3 className={resultCardTitleClassName}>{goal.originalGoal}</h3>
            <small className="mt-8 block text-[0.6rem] font-black tracking-[0.15em] text-accent-ink">
              {t("need")}
            </small>
            <p className={resultCardCopyClassName}>
              {goal.possibleUnderlyingNeed}
            </p>
            <p className={resultCardCopyClassName}>{goal.interpretation}</p>
            <EvidenceDrawer ids={goal.evidenceQuestionIds} answers={answers} />
          </article>
        ))}
      </div>
    </section>
  );
}
