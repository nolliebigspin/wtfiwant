const IMMEDIATE_DANGER_PATTERNS = [
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bcommit suicide\b/i,
  /\bsuicide (today|tonight|now)\b/i,
  /\bplan(?:ning)? to (?:die|hurt myself)\b/i,
  /\bhurt myself (today|tonight|now)\b/i,
];

export type SafetyClassification = "clear" | "immediate_self_harm_risk";

export function classifySafety(
  answers: Record<string, unknown>,
): SafetyClassification {
  const text = Object.values(answers)
    .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
    .join(" ");
  return IMMEDIATE_DANGER_PATTERNS.some((pattern) => pattern.test(text))
    ? "immediate_self_harm_risk"
    : "clear";
}

export const SAFETY_MESSAGE =
  "Your answer suggests you may be in immediate danger, so this reflection has paused. If you might act on these thoughts now, call your local emergency services or go to the nearest emergency department. If you can, contact someone you trust and do not stay alone. This app cannot provide crisis support.";
