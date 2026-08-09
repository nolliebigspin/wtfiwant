import type { SessionView } from "@wtfiwant/shared";
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
  return (
    <details className="mt-8">
      <summary
        className={`cursor-pointer text-xs font-black ${dark ? "text-acid" : "text-accent-ink"}`}
      >
        Why do you think this?
      </summary>
      <div
        className={`mt-4 border-l-2 p-4 ${dark ? "border-acid" : "border-accent"}`}
      >
        <p className="text-[0.58rem] font-black tracking-[0.13em] uppercase">
          Evidence from your answers
        </p>
        {ids.map((id) => (
          <figure className="my-4" key={id}>
            <blockquote className="m-0 whitespace-pre-wrap font-[Georgia,serif] text-base">
              {formatAnswer(answers[id])}
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

function formatAnswer(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  if (answer === undefined) return "No saved answer.";
  return JSON.stringify(answer, null, 2)
    .replace(/[{}[\]"]/g, "")
    .replace(/,/g, " · ");
}
