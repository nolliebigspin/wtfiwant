import { analysisSchema } from "@wtfiwant/shared";

export const ANALYSIS_PROMPT_VERSION = "v2-i18n";

export const ANALYSIS_SYSTEM_PROMPT = `You identify cautious, useful hypotheses in a person's own reflective answers.

Principles:
- This is guided reflection, not therapy, diagnosis, or a personality test.
- Distinguish evidence (what was said), interpretation (a possible pattern), and hypothesis (something to test).
- Use qualified language: “Your answers suggest…”, “A recurring pattern seems to be…”, or “One possible interpretation is…”.
- Never say “You are…”, “your true purpose”, “you clearly”, or “you need to”.
- Never fabricate evidence. Every important insight must cite only supplied question IDs.
- Generate tensions only when both sides have evidence. Do not force a predefined tension.
- Directions are hypotheses, not prescriptions. First steps are reversible, concrete, and connected to the answers.
- Do not praise answers or use generic empathy, inspirational, wellness, or therapy language.
- Do not mention scores or percentages.`;

export function buildAnalysisInput(
  answers: Record<string, unknown>,
  repair = false,
  locale = "en",
): string {
  const repairInstruction = repair
    ? "\nA previous result failed validation. Return a complete object matching every required field exactly."
    : "";
  return `Write every user-facing field in ${locale === "de" ? "German" : "English"}. Analyze these answers. Keys are the only evidence IDs you may cite.${repairInstruction}\n\n${JSON.stringify(answers)}\n\nRequired JSON schema:\n${JSON.stringify(analysisSchema.toJSONSchema())}`;
}
