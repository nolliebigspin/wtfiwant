import {
  assessmentQuestions,
  getGermanAssessmentTranslation,
  type Locale,
  type SessionView,
} from "@wtfiwant/shared";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { EvidenceAnswers } from "./results.types";

export function buildEvidenceAnswers(
  view: SessionView,
  locale: Locale = "en",
  additionalFollowUp = "Additional answer from the reflection",
): EvidenceAnswers {
  return {
    ...view.answers,
    ...Object.fromEntries(
      view.followUps.flatMap((followUp) =>
        followUp.userResponse
          ? [
              [
                `followup:${followUp.questionId}:${followUp.id}`,
                {
                  question:
                    followUp.locale === locale
                      ? followUp.generatedQuestion
                      : additionalFollowUp,
                  answer: followUp.userResponse,
                },
              ],
            ]
          : [],
      ),
    ),
  };
}

export function EvidenceDrawer({
  ids,
  answers,
  dark = false,
}: {
  ids: string[];
  answers: EvidenceAnswers;
  dark?: boolean;
}) {
  const t = useTranslations("Results");
  const locale = useLocale() as Locale;
  return (
    <details className="motion-disclosure mt-8">
      <summary
        className={cn(
          "cursor-pointer text-xs font-black",
          dark ? "text-acid" : "text-accent-ink",
        )}
      >
        {t("evidenceToggle")}
      </summary>
      <div
        className={cn(
          "motion-details-panel mt-4 border-l-2 p-4",
          dark ? "border-acid" : "border-accent",
        )}
      >
        <p className="text-[0.58rem] font-black tracking-[0.13em] uppercase">
          {t("evidenceTitle")}
        </p>
        {ids.map((id) => (
          <figure className="motion-feedback my-4" key={id}>
            <blockquote className="m-0 whitespace-pre-wrap font-serif text-base">
              {formatAnswer(
                answers[id],
                t("noAnswer"),
                locale,
                t.raw("answerKeys") as Record<string, string>,
              )}
            </blockquote>
            <figcaption
              className={cn(
                "mt-1.5 text-[0.58rem]",
                dark ? "text-white/55" : "text-muted",
              )}
            >
              {id}
            </figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}

function formatAnswer(
  answer: unknown,
  noAnswer: string,
  locale: Locale,
  keys: Record<string, string>,
): string {
  const optionLabels = new Map<string, string>();
  if (locale === "de") {
    const translated = getGermanAssessmentTranslation();
    for (const question of assessmentQuestions) {
      if (!("options" in question)) continue;
      question.options.forEach((option, index) => {
        optionLabels.set(
          option,
          translated.questions[question.id]?.options?.[index] ?? option,
        );
      });
    }
  }
  if (typeof answer === "string") return optionLabels.get(answer) ?? answer;
  if (Array.isArray(answer))
    return answer
      .map((item) => formatAnswer(item, noAnswer, locale, keys))
      .join(", ");
  if (answer === undefined) return noAnswer;
  if (answer && typeof answer === "object")
    return Object.entries(answer)
      .map(
        ([key, value]) =>
          `${keys[key] ?? key}: ${formatAnswer(value, noAnswer, locale, keys)}`,
      )
      .join(" · ");
  if (typeof answer === "boolean") return answer ? keys.true : keys.false;
  return String(answer);
}
