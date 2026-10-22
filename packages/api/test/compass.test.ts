import { expect, test } from "bun:test";
import {
  analysisSchema,
  compassAnalysisSchema,
  directionReviewSchema,
} from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import { analyzeAnswers } from "../src/ai/provider";
import { renderFullCompassEmail } from "../src/email/report";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisInput,
} from "../src/prompts/analysis";
import { buildReportDocument } from "../src/report/document";

const answers = {
  "life.chosen": "Friends and making things, not climbing a career ladder.",
};

test("new compass contract rejects unordered weeks, missing action criteria and unsupported observed areas", async () => {
  const result = await new LocalAIProvider().analyzeAssessment(answers);
  if (!result.compass) throw new Error("Missing compass");
  expect(compassAnalysisSchema.safeParse(result).success).toBe(true);
  const badOrder = structuredClone(result);
  if (!badOrder.compass) throw new Error("Missing compass");
  badOrder.compass.weeks.reverse();
  expect(compassAnalysisSchema.safeParse(badOrder).success).toBe(false);
  expect(
    compassAnalysisSchema.safeParse({ ...result, compass: undefined }).success,
  ).toBe(false);
  const noAction = structuredClone(result);
  if (!noAction.compass) throw new Error("Missing compass");
  noAction.compass.firstAction.doneWhen = "";
  expect(compassAnalysisSchema.safeParse(noAction).success).toBe(false);
  const unsupported = structuredClone(result);
  if (!unsupported.compass) throw new Error("Missing compass");
  unsupported.compass.lifeAreas[0].evidenceQuestionIds = [];
  expect(compassAnalysisSchema.safeParse(unsupported).success).toBe(false);
});

test("missing compass and fabricated evidence are repaired once before any result is accepted", async () => {
  let calls = 0;
  class Invalid extends LocalAIProvider {
    async analyzeAssessment(
      ...args: Parameters<LocalAIProvider["analyzeAssessment"]>
    ) {
      calls++;
      const result = await super.analyzeAssessment(...args);
      if (calls === 1) delete result.compass;
      else if (result.compass)
        result.compass.evidenceQuestionIds = ["invented.id"];
      return result;
    }
  }
  await expect(
    analyzeAnswers(new Invalid(), answers, "test", "en", undefined, true),
  ).rejects.toThrow("after repair");
  expect(calls).toBe(2);
});

test("partly fitting and uncertain directions require the person's explanation", () => {
  const input = {
    northStar: "A life with room for friends",
    priority: "Try protecting an evening",
    feedback: "",
  };
  expect(
    directionReviewSchema.safeParse({ ...input, alignment: "fits" }).success,
  ).toBe(true);
  expect(
    directionReviewSchema.safeParse({ ...input, alignment: "adjusted" })
      .success,
  ).toBe(false);
  expect(
    directionReviewSchema.safeParse({
      ...input,
      alignment: "unsure",
      feedback: "I don't know whether work is really the issue.",
    }).success,
  ).toBe(true);
  expect(
    directionReviewSchema.safeParse({
      ...input,
      alignment: "fits",
      apiKey: "never accepted",
    }).success,
  ).toBe(false);
});

test("legacy reports remain readable while new email and PDF content preserve uncertainty and user wording", async () => {
  const provider = new LocalAIProvider();
  const analysis = await provider.analyzeAssessment(
    answers,
    false,
    "test",
    "en",
  );
  if (!analysis.compass) throw new Error("Missing compass");
  const legacy = { ...analysis, compass: undefined };
  expect(analysisSchema.safeParse(legacy).success).toBe(true);
  expect(buildReportDocument(legacy, "en", answers).sections[0].title).toBe(
    "What seems to matter",
  );
  analysis.directionStatus = "unsure";
  analysis.compass.northStar =
    "I want to explore a life with room to make things.";
  const doc = buildReportDocument(analysis, "en", answers);
  const email = renderFullCompassEmail(
    analysis,
    "en",
    "https://wtfiwant.test/en/result/private",
    answers,
  );
  expect(doc.summary).toBe(analysis.compass.northStar);
  expect(doc.directionStatus).toContain("Provisional");
  expect(email.text).toContain(doc.summary);
  expect(email.text).toContain("not climbing a career ladder");
  expect(email.text).toContain(analysis.compass.review.adjustIf);
  expect(email.text).not.toContain("Confirmed by you");
  expect(email.html).not.toContain("life.chosen");
});

test("final prompt carries user corrections separately from untrusted answer text", () => {
  const prompt = buildAnalysisInput(answers, false, "de", {
    draft: {
      northStar: "Pursue leadership",
      priority: "Seek promotion",
      why: "A hypothesis",
      evidenceQuestionIds: ["life.chosen"],
      uncertainty: "Could be external pressure",
    },
    review: {
      alignment: "adjusted",
      northStar: "Mehr Zeit für Freundschaften",
      priority: "Zunächst einen freien Abend schützen",
      feedback: "Ich möchte gerade keine Beförderung.",
    },
  });
  expect(prompt).toContain("Ich möchte gerade keine Beförderung.");
  expect(prompt).toContain("NOT confirmed");
  expect(ANALYSIS_SYSTEM_PROMPT).toContain("90-day");
});

test("internal reference labels are repaired before a direction reaches the user", async () => {
  const { boundedGuidance } = await import("../src/ai/evidence");
  const { directionDraftSchema } = await import("@wtfiwant/shared");
  let calls = 0;
  const result = await boundedGuidance(
    async (repair) => {
      calls++;
      return {
        northStar: "Time for people and chosen work",
        priority: "Protect an evening",
        why: repair
          ? "You described choosing time with friends."
          : "You said this in life.chosen.",
        evidenceQuestionIds: ["life.chosen"],
        uncertainty: "The most fitting change still needs testing.",
      };
    },
    (value) => directionDraftSchema.parse(value),
    answers,
  );
  expect(calls).toBe(2);
  expect(result.why).not.toContain("life.chosen");
});

test("new reports cite constraints where used while saved older reports remain readable", async () => {
  const { buildEmailEvidence } = await import("../src/email/evidence");
  const result = await new LocalAIProvider().analyzeAssessment(answers);
  if (!result.compass) throw new Error("Missing compass");
  const source = {
    ...answers,
    "refinement:q5": {
      question: "What limits the next step?",
      answer: "My manager has to release another task first.",
    },
    "uncited.secret": "Unrelated private answer",
  };
  result.compass.obstacles[0].evidenceQuestionIds = ["refinement:q5"];
  const evidence = buildEmailEvidence(result, source);
  expect(evidence["refinement:q5"]).toEqual(source["refinement:q5"]);
  expect(evidence).not.toHaveProperty("uncited.secret");
  const old = structuredClone(result);
  if (!old.compass) throw new Error("Missing compass");
  delete old.compass.obstacles[0].evidenceQuestionIds;
  expect(analysisSchema.safeParse(old).success).toBe(true);
  expect(compassAnalysisSchema.safeParse(old).success).toBe(false);
});

test("paid report editing is validated and is not run by legacy analysis reads", async () => {
  let edits = 0;
  let invalid = false;
  class Editor extends LocalAIProvider {
    async reviewCompass(
      draft: NonNullable<import("@wtfiwant/shared").Analysis["compass"]>,
    ) {
      edits++;
      return {
        ...draft,
        whyThisFits:
          "Your chosen activities and relationships provide a direction to try.",
        evidenceQuestionIds: invalid
          ? ["invented.constraint"]
          : draft.evidenceQuestionIds,
      };
    }
  }
  const provider = new Editor();
  const paid = await analyzeAnswers(
    provider,
    answers,
    "test",
    "en",
    undefined,
    true,
  );
  expect(edits).toBe(1);
  expect(paid.compass?.whyThisFits).toContain("direction to try");
  await analyzeAnswers(provider, answers, "test", "en");
  expect(edits).toBe(1);
  invalid = true;
  await expect(
    analyzeAnswers(provider, answers, "test", "en", undefined, true),
  ).rejects.toThrow("Invalid edited compass");
});

test("the direction map leads from priority through action to the 90-day horizon", async () => {
  const { compassPath, compassHeadline, buildCompassSections } = await import(
    "@wtfiwant/shared"
  );
  const analysis = await new LocalAIProvider().analyzeAssessment(answers);
  if (!analysis.compass) throw new Error("Missing compass");
  expect(compassPath(analysis.compass, "de").map((item) => item.id)).toEqual([
    "priority",
    "start",
    "horizon",
  ]);
  expect(compassHeadline("unsure", "de")).toBe("Eine Richtung zum Erkunden.");
  const doc = buildCompassSections(analysis.compass, "de");
  expect(
    doc[0].items.some((item) => item.title?.includes("Weitere Lebensbereiche")),
  ).toBe(false);
  expect(
    doc
      .find((section) => section.kind === "decisions")
      ?.items.some((item) =>
        item.paragraphs.some((p) => p.startsWith("Dann: Wenn")),
      ),
  ).toBe(false);
});
