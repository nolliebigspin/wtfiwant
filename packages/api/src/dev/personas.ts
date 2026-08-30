import type { SeedPersona } from "@wtfiwant/shared";
import { LocalAIProvider } from "../ai/local";
import { analyzeAnswers } from "../ai/provider";
import { ANALYSIS_PROMPT_VERSION } from "../prompts/analysis";
import type { AssessmentRepository } from "../repositories/types";

const common = {
  "life.energy": ["Work", "Partner", "Health / fitness"],
  "life.chosen": "I chose my partner and the craft I have become good at.",
  "life.drifted":
    "My weeks became almost entirely organized around work without me deciding that.",
  "alive.memories": {
    memories: [
      {
        story:
          "A long unplanned dinner with close friends after a day outside.",
        with: "Close friends",
        where: "By a lake",
        doing: "Talking and cooking",
        special: "Nobody was rushing anywhere",
      },
      {
        story: "Finishing a difficult project with a small team I respected.",
        with: "My team",
        where: "At work",
        doing: "Building something useful",
        special: "The challenge felt chosen and shared",
      },
    ],
  },
  "noise.working_toward": "A bigger role and enough money to feel free.",
  "noise.private_desire": "I'm not sure",
  "noise.supposed":
    "I am supposed to keep advancing, buy a larger home, and look successful.",
  "noise.jealous":
    "People who have control of their week and still see their oldest friends often.",
  "possibilities.three_lives": {
    lives: [
      {
        id: "roots",
        attracts: "People nearby and continuity",
        repels: "Too much predictability",
      },
      {
        id: "freedom",
        attracts: "Autonomy and new environments",
        repels: "Losing daily closeness",
      },
      {
        id: "build",
        attracts: "Challenge and making something",
        repels: "Work consuming everything",
      },
    ],
    customLife: "A home base with seasons of travel and work I can shape.",
  },
  "tradeoffs.choices": {
    choices: [-1, -2, -1, 2, 2, 1],
    touched: [true, true, true, true, true, true],
  },
  "tradeoffs.accepted_downside":
    "I would accept earning less for more control of my time.",
  "anti_life.regret":
    "Never trying to design work around life instead of the reverse.",
  "anti_life.repeated_year":
    "Being permanently tired and postponing people and places I love.",
  "anti_life.description":
    "Financially successful, always reachable, and waiting for weekends to feel alive.",
  "goals.current": {
    goals: [
      {
        goal: "Work fewer hours",
        why: "I want energy for people and projects outside my job",
      },
      {
        goal: "Spend a month abroad",
        why: "I want novelty without abandoning my relationships",
      },
    ],
  },
};

const variations: Record<SeedPersona, Record<string, unknown>> = {
  burned_out: {
    "noise.working_toward":
      "The next leadership role, although I am already exhausted.",
    "anti_life.description":
      "Impressive title, no unclaimed attention, and relationships maintained by apology.",
  },
  freedom_relationships: {
    "noise.working_toward":
      "Location independence without becoming a visitor in everyone's life.",
    "anti_life.description":
      "Free to go anywhere but with nobody who expects me back.",
  },
  stable_adventure: {
    "life.drifted":
      "The stable routine works, but every week feels almost identical.",
    "anti_life.description":
      "Safe and comfortable, then realizing I stopped being surprised by my own life.",
  },
};

export async function createSeedSession(
  repository: AssessmentRepository,
  persona: SeedPersona,
) {
  const view = await repository.createSession();
  const answers = { ...common, ...variations[persona] };
  for (const [questionId, value] of Object.entries(answers)) {
    await repository.saveAnswer(view.session.id, questionId, value);
  }
  const provider = new LocalAIProvider();
  const result = await analyzeAnswers(provider, answers, view.session.id);
  await repository.saveAnalysis(view.session.id, {
    version: ANALYSIS_PROMPT_VERSION,
    model: provider.name,
    locale: "en",
    result,
    createdAt: new Date().toISOString(),
  });
  const completed = await repository.getSession(view.session.id);
  if (!completed) throw new Error("Seeded Reflection disappeared");
  return completed;
}
