import type { AssessmentQuestion } from "@wtfiwant/shared";

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isAnswerComplete(
  question: AssessmentQuestion,
  value: unknown,
): boolean {
  if (!question.required) return true;
  if (question.type === "long_text" || question.type === "single_choice")
    return hasText(value);
  if (question.type === "multi_choice")
    return Array.isArray(value) && value.length > 0;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (question.type === "memories") {
    return (
      Array.isArray(record.memories) &&
      record.memories.some(
        (memory) =>
          memory &&
          typeof memory === "object" &&
          hasText((memory as Record<string, unknown>).story),
      )
    );
  }
  if (question.type === "three_lives") {
    if (hasText(record.customLife)) return true;
    return (
      Array.isArray(record.lives) &&
      record.lives.length === 3 &&
      record.lives.every(
        (life) =>
          life &&
          typeof life === "object" &&
          (hasText((life as Record<string, unknown>).attracts) ||
            hasText((life as Record<string, unknown>).repels)),
      )
    );
  }
  if (question.type === "tradeoffs") {
    return Array.isArray(record.choices) && record.choices.length === 6;
  }
  if (question.type === "goals") {
    return (
      Array.isArray(record.goals) &&
      record.goals.length >= 1 &&
      record.goals.every(
        (goal) =>
          goal &&
          typeof goal === "object" &&
          hasText((goal as Record<string, unknown>).goal) &&
          hasText((goal as Record<string, unknown>).why),
      )
    );
  }
  return false;
}

export function answerToFollowUpText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "goals" in value) {
    const goals = (value as { goals?: Array<{ goal?: string; why?: string }> })
      .goals;
    const first = goals?.[0];
    if (first?.goal) return `${first.goal}. Why: ${first.why ?? "unspecified"}`;
  }
  return JSON.stringify(value);
}
