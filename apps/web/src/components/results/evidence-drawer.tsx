import type { SessionView } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import type { EvidenceAnswers } from "./results.types";

export function buildEvidenceAnswers(view: SessionView): EvidenceAnswers {
  return {
    ...view.answers,
    ...Object.fromEntries(
      view.followUps.flatMap((followUp) =>
        followUp.userResponse
          ? [
              [
                `followup:${followUp.questionId}:${followUp.id}`,
                {
                  question: followUp.generatedQuestion,
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
  return (
    <details className="mt-8">
      <summary
        className={`cursor-pointer text-xs font-black ${dark ? "text-acid" : "text-accent-ink"}`}
      >
        {t("evidenceToggle")}
      </summary>
      <div
        className={`mt-4 border-l-2 p-4 ${dark ? "border-acid" : "border-accent"}`}
      >
        <p className="text-[0.58rem] font-black tracking-[0.13em] uppercase">
          {t("evidenceTitle")}
        </p>
        {ids.map((id) => (
          <figure className="my-4" key={id}>
            <blockquote className="m-0 whitespace-pre-wrap font-[Georgia,serif] text-base">
              {formatAnswer(answers[id], t("noAnswer"))}
            </blockquote>
            <figcaption
              className={`mt-1.5 text-[0.58rem] ${dark ? "text-white/55" : "text-muted"}`}
            >
              {id}
            </figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}

function formatAnswer(answer: unknown, noAnswer: string): string {
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  if (answer === undefined) return noAnswer;
  return JSON.stringify(answer, null, 2)
    .replace(/[{}[\]"]/g, "")
    .replace(/,/g, " · ");
}
