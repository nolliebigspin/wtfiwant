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
    <details className={`evidence-drawer ${dark ? "dark" : ""}`}>
      <summary>Why do you think this?</summary>
      <div>
        <p className="evidence-label">Evidence from your answers</p>
        {ids.map((id) => (
          <figure key={id}>
            <blockquote>{formatAnswer(answers[id])}</blockquote>
            <figcaption>{id}</figcaption>
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
