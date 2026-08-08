import { type AssessmentQuestion, questionById } from "@wtfiwant/shared";

type ValidationResult = { success: true } | { success: false; message: string };

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateStructured(
  question: AssessmentQuestion,
  value: unknown,
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;

  if (question.type === "memories") {
    const memories = record.memories;
    return (
      Array.isArray(memories) &&
      memories.length >= 1 &&
      memories.length <= 3 &&
      memories.every(
        (memory) =>
          memory &&
          typeof memory === "object" &&
          hasText((memory as Record<string, unknown>).story),
      )
    );
  }

  if (question.type === "three_lives") {
    const lives = record.lives;
    if (hasText(record.customLife)) return true;
    return (
      Array.isArray(lives) &&
      lives.length === 3 &&
      lives.every(
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
    const goals = record.goals;
    return (
      Array.isArray(goals) &&
      goals.length >= 1 &&
      goals.length <= 3 &&
      goals.every(
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

export function validateAnswer(
  questionId: string,
  value: unknown,
): ValidationResult {
  const question = questionById.get(questionId);
  if (!question) return { success: false, message: "Unknown question" };

  let valid = false;
  switch (question.type) {
    case "long_text":
      valid = hasText(value);
      break;
    case "single_choice":
      valid = typeof value === "string" && question.options.includes(value);
      break;
    case "multi_choice":
      valid = Array.isArray(value) && value.length > 0 && value.every(hasText);
      break;
    default:
      valid = validateStructured(question, value);
  }

  return valid
    ? { success: true }
    : { success: false, message: "Answer does not match this question" };
}
