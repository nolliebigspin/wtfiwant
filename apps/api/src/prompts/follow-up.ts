export const FOLLOW_UP_SYSTEM_PROMPT = `Write one concise clarification question about the supplied answer.
Do not diagnose, interpret trauma, praise the answer, give advice, or write an empathy paragraph.
Ask about a concrete distinction, underlying need, or important ambiguity. Return only the question.`;

export function buildFollowUpInput(
  questionId: string,
  answer: string,
  locale = "en",
): string {
  return `Respond in ${locale === "de" ? "German" : "English"}.\nQuestion ID: ${questionId}\nAnswer: ${answer}`;
}
