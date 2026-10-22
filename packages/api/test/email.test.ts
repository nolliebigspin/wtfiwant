import { describe, expect, test } from "bun:test";
import { formatReportAnswer } from "@wtfiwant/shared";
import { LocalAIProvider } from "../src/ai/local";
import {
  buildEmailEvidence,
  renderFullCompassEmail,
} from "../src/email/report";

describe("Full Compass email", () => {
  test("preserves free text even when it matches a canonical option", () => {
    expect(formatReportAnswer("life.chosen", "Work", "de")).toBe("Work");
    expect(formatReportAnswer("life.energy", ["Work"], "de")).toBe("Arbeit");
    expect(
      formatReportAnswer(
        "coach:you:example",
        { question: "Was bedeutet das?", answer: "Work" },
        "de",
      ),
    ).toContain("Antwort: Work");
  });
  test("localizes German report markup and evidence labels while preserving written answers", async () => {
    const original = "Meine selbst gewählte Arbeit gibt mir Freiheit.";
    const source = {
      "life.chosen": original,
      "alive.memories": { memories: [{ story: "Ein Abend mit Freunden" }] },
      "tradeoffs.choices": {
        choices: [-2, -1, 0, 1, 2, 0],
        touched: [true, true, true, true, true, true],
      },
      "life.energy": ["Work", "Partner"],
      "goals.current": { goals: [{ goal: "Mehr Zeit", why: "Mehr Freiheit" }] },
    };
    const analysis = await new LocalAIProvider().analyzeAssessment(
      source,
      false,
      "test",
      "de",
    );
    analysis.coreDrivers[0].evidenceQuestionIds.push("life.energy");
    analysis.compass?.evidenceQuestionIds.push(
      "alive.memories",
      "tradeoffs.choices",
      "life.energy",
    );
    const email = renderFullCompassEmail(
      analysis,
      "de",
      "https://wtfiwant.test/de/result/private-session",
      source,
    );
    expect(email.html).toContain('<html lang="de">');
    expect(email.subject).toBe("Dein vollständiger Kompass");
    expect(email.text).toContain("Ein Abend mit Freunden");
    expect(email.text).toContain("Arbeit, Partner:in");
    expect(email.text).toContain(original);
    expect(email.text).not.toContain("memories: story:");
    for (const id of Object.keys(source)) {
      expect(email.html).not.toContain(id);
      expect(email.text).not.toContain(id);
    }
    expect(email.text).toContain("Mehr Freiheit");
    expect(email.text).not.toContain("-2, -1, 0");
    expect(email.html).not.toContain("Ausgewählt: ja");
  });

  test("contains every result section and only the cited reflection evidence", async () => {
    const citedAnswer = "I deliberately chose flexible work.";
    const uncitedAnswer = "UNRELATED RAW ANSWER THAT MUST NOT BE EMAILED";
    const source = {
      "life.chosen": citedAnswer,
      "noise.working_toward": "More freedom and time with friends",
      "noise.supposed": "I should want a prestigious title",
      "anti_life.description": "Always waiting for weekends",
      "goals.current": {
        goals: [{ goal: "Flexible work", why: "Time for people" }],
      },
      "uncited.secret": uncitedAnswer,
    };
    const analysis = await new LocalAIProvider().analyzeAssessment(source);

    const email = renderFullCompassEmail(
      analysis,
      "en",
      "https://wtfiwant.test/en/result/private-session",
      buildEmailEvidence(analysis, source),
    );

    for (const heading of [
      "Why this direction may fit",
      "Your goal for the next 90 days",
      "Your next four weeks",
      "When things get difficult",
      "Review and adjust your course",
    ])
      expect(email.html).toContain(heading);
    expect(email.html).toContain("Evidence");
    expect(email.text).toContain("delete this reflection");
    expect(email.html).toContain(citedAnswer);
    expect(email.text).toContain(citedAnswer);
    expect(email.html).not.toContain(uncitedAnswer);
    expect(email.text).not.toContain(uncitedAnswer);
  });
});
