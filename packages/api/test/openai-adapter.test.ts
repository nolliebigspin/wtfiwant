import { expect, test } from "bun:test";
import type { RefinementPlan } from "@wtfiwant/shared";
import OpenAI from "openai";
import { OpenAIProvider } from "../src/ai/openai";

test("OpenAI refinement sends an object JSON schema from the shared Zod 4 contract", async () => {
  let called = false;
  const plan: RefinementPlan = {
    questions: [
      {
        id: "q1",
        question: "Which small change would give your chosen work more room?",
        evidenceQuestionIds: ["life.chosen"],
      },
    ],
  };
  const client = new OpenAI({
    apiKey: "test-only",
    dangerouslyAllowBrowser: true,
    maxRetries: 0,
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      called = true;
      expect(body.text.format.schema.type).toBe("object");
      expect(body.text.format.schema.properties.questions.type).toBe("array");
      expect(body.store).toBe(false);
      expect(body.model).toBe("gpt-6-luna");
      return Response.json({
        id: "resp_test",
        object: "response",
        status: "completed",
        output: [
          {
            id: "msg_test",
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(plan),
                annotations: [],
              },
            ],
          },
        ],
      });
    },
  });
  const provider = new OpenAIProvider({
    apiKey: "test-only",
    analysisModel: "gpt-6-luna",
    followUpModel: "gpt-6-luna",
    client,
  });
  expect(
    await provider.generateRefinementPlan(
      { "life.chosen": "A small team" },
      crypto.randomUUID(),
      "en",
    ),
  ).toEqual(plan);
  expect(called).toBe(true);
});

test("editor uses the strict compass schema and keeps review metadata outside model output", async () => {
  const { LocalAIProvider } = await import("../src/ai/local");
  const source = { "life.chosen": "Time with friends and chosen work" };
  const generated = await new LocalAIProvider().analyzeAssessment(source);
  if (!generated.compass) throw new Error("Missing fixture compass");
  const { compassGenerationSchema } = await import("@wtfiwant/shared");
  const compass = compassGenerationSchema.parse(generated.compass);
  const client = new OpenAI({
    apiKey: "test-only",
    dangerouslyAllowBrowser: true,
    maxRetries: 0,
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.store).toBe(false);
      expect(body.text.format.schema.properties).not.toHaveProperty(
        "directionStatus",
      );
      expect(body.text.format.schema.properties.goal.required).toContain(
        "evidenceQuestionIds",
      );
      expect(
        body.text.format.schema.properties.obstacles.items.required,
      ).toContain("evidenceQuestionIds");
      expect(body.instructions).toContain("somebody else's permission");
      return Response.json({
        id: "resp_editor_test",
        object: "response",
        status: "completed",
        output: [
          {
            id: "msg_editor_test",
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(compass),
                annotations: [],
              },
            ],
          },
        ],
      });
    },
  });
  const provider = new OpenAIProvider({
    apiKey: "test-only",
    analysisModel: "gpt-6-luna",
    followUpModel: "gpt-6-luna",
    client,
  });
  expect(await provider.reviewCompass(compass, source, "test", "en")).toEqual(
    compass,
  );
});
