import { LocalAIProvider } from "./local";
import { OpenAIProvider } from "./openai";
import type { AIProvider } from "./provider";

export function createAIProvider(env = process.env): AIProvider {
  if (env.AI_PROVIDER !== "openai") return new LocalAIProvider();
  if (!env.AI_API_KEY)
    throw new Error("AI_API_KEY is required when AI_PROVIDER=openai");
  return new OpenAIProvider({
    apiKey: env.AI_API_KEY,
    analysisModel: env.AI_MODEL ?? "gpt-5-mini",
    followUpModel: env.AI_FOLLOWUP_MODEL ?? env.AI_MODEL ?? "gpt-5-mini",
  });
}
