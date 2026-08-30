import { generatedCoachPromptSchema } from "@wtfiwant/shared";

export const COACH_PROMPT_VERSION = "v1-chapter-evidence";

export const COACH_SYSTEM_PROMPT = `Write one concise clarification question about the supplied reflection answers.
Do not diagnose, advise, praise, summarize the person, write an empathy paragraph, or suggest an answer.
Ask for a concrete example, an underlying need, or an important distinction.
Cite one to three supplied question IDs that make the clarification useful.`;

export function buildCoachInput(
  answers: Record<string, unknown>,
  locale = "en",
): string {
  return `Write the question in ${locale === "de" ? "German" : "English"}. Keys are the only evidence IDs you may cite.\n\n${JSON.stringify(answers)}\n\nRequired JSON schema:\n${JSON.stringify(generatedCoachPromptSchema.toJSONSchema())}`;
}
