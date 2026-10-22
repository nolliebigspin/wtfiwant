import {
  type Compass,
  compassAnalysisSchema,
  compassGenerationSchema,
  type DirectionDraft,
  type DirectionReview,
  directionDraftSchema,
  generatedCoachPromptSchema,
  type Locale,
  refinementPlanSchema,
} from "@wtfiwant/shared";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisInput,
} from "../prompts/analysis";
import { buildCoachInput, COACH_SYSTEM_PROMPT } from "../prompts/coach";
import { DIRECTION_SYSTEM_PROMPT, directionInput } from "../prompts/direction";
import {
  buildFollowUpInput,
  FOLLOW_UP_SYSTEM_PROMPT,
} from "../prompts/follow-up";
import {
  REFINEMENT_SYSTEM_PROMPT,
  refinementInput,
} from "../prompts/refinement";
import {
  REPORT_EDITOR_PROMPT,
  reportEditorInput,
} from "../prompts/report-editor";
import type { AIProvider } from "./provider";

type OpenAIProviderOptions = {
  apiKey: string;
  analysisModel: string;
  followUpModel: string;
  client?: OpenAI;
};

export class OpenAIProvider implements AIProvider {
  readonly name: string;
  private readonly client: OpenAI;
  private readonly followUpModel: string;

  async reviewCompass(
    draft: Compass,
    answers: Record<string, unknown>,
    safetyIdentifier: string | undefined,
    locale: Locale,
    direction?: { draft: DirectionDraft; review: DirectionReview | null },
  ) {
    const response = await this.client.responses.parse({
      model: this.name,
      instructions: REPORT_EDITOR_PROMPT,
      input: reportEditorInput(draft, answers, locale, direction),
      max_output_tokens: 9000,
      reasoning: { effort: "low" },
      text: {
        format: zodTextFormat(compassGenerationSchema, "edited_compass"),
      },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    if (response.status !== "completed")
      throw new Error("Incomplete editorial response");
    return response.output_parsed;
  }

  constructor(options: OpenAIProviderOptions) {
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        timeout: 90_000,
        maxRetries: 0,
      });
    this.name = options.analysisModel;
    this.followUpModel = options.followUpModel;
  }

  async generateRefinementPlan(
    answers: Record<string, unknown>,
    safetyIdentifier: string,
    locale: Locale,
    repair = false,
  ) {
    const response = await this.client.responses.parse({
      model: this.followUpModel,
      instructions: `${REFINEMENT_SYSTEM_PROMPT}${repair ? "\nRepair your previous response: use only supplied evidence IDs in arrays, keep questions under 400 characters, and match every schema field." : ""}`,
      input: refinementInput(answers, locale),
      max_output_tokens: 4000,
      reasoning: { effort: "low" },
      text: { format: zodTextFormat(refinementPlanSchema, "refinement_plan") },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    if (response.status !== "completed")
      throw new Error("Incomplete refinement response");
    return refinementPlanSchema.parse(response.output_parsed);
  }

  async generateDirection(
    answers: Record<string, unknown>,
    safetyIdentifier: string,
    locale: Locale,
    repair = false,
  ) {
    const response = await this.client.responses.parse({
      model: this.followUpModel,
      instructions: `${DIRECTION_SYSTEM_PROMPT}${repair ? "\nRepair your previous response: no evidence identifiers in prose, only supplied IDs in arrays, and match every schema field." : ""}`,
      input: directionInput(answers, locale),
      max_output_tokens: 3000,
      reasoning: { effort: "low" },
      text: { format: zodTextFormat(directionDraftSchema, "direction_draft") },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    if (response.status !== "completed")
      throw new Error("Incomplete direction response");
    return directionDraftSchema.parse(response.output_parsed);
  }

  async generateCoachPrompt(
    answers: Record<string, unknown>,
    safetyIdentifier?: string,
    locale: Locale = "en",
  ) {
    let failure: unknown;
    for (const repair of [false, true]) {
      try {
        const response = await this.client.responses.parse({
          model: this.followUpModel,
          instructions: repair
            ? `${COACH_SYSTEM_PROMPT}\nYour previous response was invalid. Return only a value matching the schema exactly.`
            : COACH_SYSTEM_PROMPT,
          input: buildCoachInput(answers, locale),
          max_output_tokens: 2000,
          text: {
            format: zodTextFormat(generatedCoachPromptSchema, "coach_prompt"),
          },
          store: false,
          safety_identifier: safetyIdentifier,
        });
        return generatedCoachPromptSchema.parse(response.output_parsed);
      } catch (error) {
        failure = error;
      }
    }
    throw failure;
  }

  async generateFollowUp(
    questionId: string,
    answer: string,
    safetyIdentifier?: string,
    locale: Locale = "en",
  ): Promise<string> {
    const response = await this.client.responses.create({
      model: this.followUpModel,
      instructions: FOLLOW_UP_SYSTEM_PROMPT,
      input: buildFollowUpInput(questionId, answer, locale),
      max_output_tokens: 2000,
      store: false,
      safety_identifier: safetyIdentifier,
    });
    const question = response.output_text.trim();
    if (!question) throw new Error("AI provider returned an empty follow-up");
    return question;
  }

  async analyzeAssessment(
    answers: Record<string, unknown>,
    repair: boolean,
    safetyIdentifier?: string,
    locale: Locale = "en",
    direction?: { draft: DirectionDraft; review: DirectionReview | null },
  ): Promise<unknown> {
    const response = await this.client.responses.parse({
      model: this.name,
      instructions: ANALYSIS_SYSTEM_PROMPT,
      input: buildAnalysisInput(answers, repair, locale, direction),
      max_output_tokens: 12000,
      reasoning: { effort: "low" },
      text: {
        format: zodTextFormat(compassAnalysisSchema, "assessment_analysis"),
      },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    if (response.status !== "completed")
      throw new Error("Incomplete analysis response");
    return response.output_parsed;
  }
}
