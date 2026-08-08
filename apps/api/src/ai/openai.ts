import { analysisSchema } from "@wtfiwant/shared";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisInput,
} from "../prompts/analysis";
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

  async generateFollowUp(
    questionId: string,
    answer: string,
    safetyIdentifier?: string,
  ): Promise<string> {
    const response = await this.client.responses.create({
      model: this.followUpModel,
      instructions: FOLLOW_UP_SYSTEM_PROMPT,
      input: buildFollowUpInput(questionId, answer),
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
  ): Promise<unknown> {
    const response = await this.client.responses.parse({
      model: this.name,
      instructions: ANALYSIS_SYSTEM_PROMPT,
      input: buildAnalysisInput(answers, repair),
      text: { format: zodTextFormat(analysisSchema, "assessment_analysis") },
      store: false,
      safety_identifier: safetyIdentifier,
    });
    return response.output_parsed;
  }
}
