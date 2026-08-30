import { describe, expect, test } from "bun:test";
import { LocalAIProvider } from "../src/ai/local";
import {
  buildEmailEvidence,
  renderFullCompassEmail,
} from "../src/email/report";

describe("Full Compass email", () => {
  test("contains every result section and only the cited reflection evidence", async () => {
    const citedAnswer = "I deliberately chose flexible work.";
    const uncitedAnswer = "UNRELATED RAW ANSWER THAT MUST NOT BE EMAILED";
    const source = {
      "life.chosen": citedAnswer,
      "noise.working_toward": "More freedom and time with friends",
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
      "What seems to matter",
      "Tensions",
      "Your Anti-Life",
      "Outside influences",
      "Directions worth exploring",
      "Beneath your goals",
      "First steps",
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
