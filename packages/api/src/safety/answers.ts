import type { AssessmentRecord } from "../repositories/types";

export function buildSafetyAnswers(
  record: AssessmentRecord,
): Record<string, unknown> {
  return {
    ...record.answers,
    ...Object.fromEntries(
      record.followUps.flatMap((prompt) =>
        prompt.userResponse
          ? [
              [
                `followup:${prompt.questionId}:${prompt.id}`,
                prompt.userResponse,
              ],
            ]
          : [],
      ),
    ),
    ...Object.fromEntries(
      record.coachPrompts.flatMap((prompt) =>
        prompt.userResponse
          ? [[`coach:${prompt.chapter}:${prompt.id}`, prompt.userResponse]]
          : [],
      ),
    ),
  };
}
