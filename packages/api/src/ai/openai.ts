import {
  analysisSchema,
  generatedCoachPromptSchema,
  type Locale,
} from "@wtfiwant/shared";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisInput,
} from "../prompts/analysis";
import { buildCoachInput, COACH_SYSTEM_PROMPT } from "../prompts/coach";
import {
  buildFollowUpInput,
  FOLLOW_UP_SYSTEM_PROMPT,
} from "../prompts/follow-up";
import type { AIProvider } from "./provider";

type OpenAIProviderOptions = {
  apiKey: string;
  analysisModel: string;
  followUpModel: string;
};

export class OpenAIProvider implements AIProvider {
  readonly name: string;
  private readonly client: OpenAI;
  private readonly followUpModel: string;

  constructor(options: OpenAIProviderOptions) {
    this.client = new OpenAI({ apiKey: options.apiKey });
    this.name = options.analysisModel;
    this.followUpModel = options.followUpModel;
  }

  async generateCoachPrompt(
    answers: Record<string, unknown>,
    safetyIdentifier?: string,
    locale: Locale = "en",
  ) {
    const response = await this.client.responses.parse({
      model: this.followUpModel,
      instructions: COACH_SYSTEM_PROMPT,
      input: buildCoachInput(answers, locale),
      max_output_tokens: 220,
      text: {
        format: zodTextFormat(generatedCoachPromptSchema, "coach_prompt"),
      },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    return generatedCoachPromptSchema.parse(response.output_parsed);
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
      max_output_tokens: 120,
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
  ): Promise<unknown> {
    const response = await this.client.responses.parse({
      model: this.name,
      instructions: ANALYSIS_SYSTEM_PROMPT,
      input: buildAnalysisInput(answers, repair, locale),
      text: { format: zodTextFormat(analysisSchema, "assessment_analysis") },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    return response.output_parsed;
  }
}
