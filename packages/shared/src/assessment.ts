import type { ChapterId } from "./schemas";

export const chapters: ReadonlyArray<{
  id: ChapterId;
  label: string;
  eyebrow: string;
}> = [
  { id: "you", label: "YOU", eyebrow: "Start with what is actually here." },
  { id: "alive", label: "ALIVE", eyebrow: "Look for lived evidence." },
  { id: "noise", label: "NOISE", eyebrow: "Separate desire from expectation." },
  {
    id: "possibilities",
    label: "POSSIBILITIES",
    eyebrow: "Notice the attributes, not the stereotype.",
  },
  {
    id: "tradeoffs",
    label: "TRADE-OFFS",
    eyebrow: "A preference without a cost tells us very little.",
  },
  {
    id: "anti-life",
    label: "ANTI-LIFE",
    eyebrow: "A clear no can be more useful than a vague yes.",
  },
  { id: "goals", label: "GOALS", eyebrow: "Now we can ask what you want." },
] as const;

type BaseQuestion = {
  id: string;
  chapter: ChapterId;
  prompt: string;
  description?: string;
  required?: boolean;
};

export type AssessmentQuestion = BaseQuestion &
  (
    | { type: "long_text"; placeholder?: string }
    | {
        type: "multi_choice";
        options: readonly string[];
        allowOther?: boolean;
        otherLabel?: string;
        otherPlaceholder?: string;
      }
    | { type: "single_choice"; options: readonly string[] }
    | { type: "memories" }
    | { type: "three_lives" }
    | { type: "tradeoffs" }
    | { type: "goals" }
  );

export const assessmentQuestions: readonly AssessmentQuestion[] = [
  {
    id: "life.energy",
    chapter: "you",
    type: "multi_choice",
    prompt: "What currently takes most of your time and energy?",
    description:
      "Choose everything that is genuinely taking up space — not only what matters most.",
    options: [
      "Work",
      "Partner",
      "Family",
      "Friends",
      "Children",
      "Health / fitness",
      "Money",
      "Building something",
      "Studying",
      "Social media / entertainment",
      "Travel",
    ],
    allowOther: true,
    otherLabel: "Something else",
    otherPlaceholder: "What else is taking your energy?",
    required: true,
  },
  {
    id: "life.chosen",
    chapter: "you",
    type: "long_text",
    prompt:
      "What part of your current life feels most like something you consciously chose?",
    placeholder: "The part that feels authored by you…",
    required: true,
  },
  {
    id: "life.drifted",
    chapter: "you",
    type: "long_text",
    prompt: "What part feels like you somehow just ended up there?",
    placeholder: "The thing that arrived by default…",
    required: true,
  },
  {
    id: "alive.memories",
    chapter: "alive",
    type: "memories",
    prompt: "When did you feel genuinely alive?",
    description:
      "Think about the last few years. Describe up to three real moments when you felt fulfilled, proud, peaceful, or deeply happy. One honest memory is enough to continue.",
    required: true,
  },
  {
    id: "noise.working_toward",
    chapter: "noise",
    type: "long_text",
    prompt: "What are you currently working toward?",
    placeholder: "A promotion, a home, a different body, more freedom…",
    required: true,
  },
  {
    id: "noise.private_desire",
    chapter: "noise",
    type: "single_choice",
    prompt:
      "If nobody could ever know that you achieved it, would you still want it?",
    options: [
      "Definitely",
      "Probably",
      "I'm not sure",
      "Probably not",
      "Definitely not",
    ],
    required: true,
  },
  {
    id: "noise.supposed",
    chapter: "noise",
    type: "long_text",
    prompt: "What do you think you're supposed to want?",
    description:
      "Career, house, marriage, children, money, status, travel, entrepreneurship, fitness…",
    required: true,
  },
  {
    id: "noise.jealous",
    chapter: "noise",
    type: "long_text",
    prompt:
      "Whose life are you slightly jealous of — and what exactly about it do you want?",
    description:
      "Jealousy is data here, not a character flaw. Be specific about the attribute.",
    required: true,
  },
  {
    id: "possibilities.three_lives",
    chapter: "possibilities",
    type: "three_lives",
    prompt: "Three lives. What pulls you in — and what repels you?",
    description:
      "You are not choosing a package. You are looking for ingredients.",
    required: true,
  },
  {
    id: "tradeoffs.choices",
    chapter: "tradeoffs",
    type: "tradeoffs",
    prompt: "Choose the direction you lean — even if you want both.",
    description:
      "These are signals, not a personality score. The middle is allowed when it is honest.",
    required: true,
  },
  {
    id: "tradeoffs.accepted_downside",
    chapter: "tradeoffs",
    type: "long_text",
    prompt:
      "Which downside would you be most willing to accept for a life you truly wanted?",
    description:
      "Every life has a price. Which price could actually be worth paying?",
    required: true,
  },
  {
    id: "anti_life.regret",
    chapter: "anti-life",
    type: "long_text",
    prompt: "What would hurt the most to realize you never even tried?",
    description: "Imagine you're much older and looking back.",
    required: true,
  },
  {
    id: "anti_life.repeated_year",
    chapter: "anti-life",
    type: "long_text",
    prompt:
      "Imagine the next ten years look almost exactly like the last year. What about that scares you?",
    required: true,
  },
  {
    id: "anti_life.description",
    chapter: "anti-life",
    type: "long_text",
    prompt: "The life I don't want",
    description:
      "Maybe it is always waiting for weekends, having money but no time, being alone, being trapped, or living mainly for other people's expectations. Describe yours.",
    placeholder:
      "A concrete portrait of the life you refuse to sleepwalk into…",
    required: true,
  },
  {
    id: "goals.current",
    chapter: "goals",
    type: "goals",
    prompt: "What are three things you currently think you want?",
    description:
      "One to three is enough. For each, go one layer beneath the stated goal.",
    required: true,
  },
] as const;

export const tradeoffPairs = [
  ["More freedom", "More security"],
  ["More time", "More money"],
  ["Adventure", "Stability"],
  ["Achievement", "Low stress"],
  ["Living somewhere exciting", "Living close to people you love"],
  ["Building something meaningful", "Protecting your free time"],
] as const;

export const threeLives = [
  {
    id: "roots",
    name: "Life A — Roots",
    description:
      "Stable home. People you love nearby. Predictability. Strong community. Less novelty.",
  },
  {
    id: "freedom",
    name: "Life B — Freedom",
    description:
      "Live almost anywhere. Few possessions. Changing environments. High autonomy. Less stability.",
  },
  {
    id: "build",
    name: "Life C — Build",
    description:
      "Years spent building something ambitious. High challenge. Possible financial reward. Less free time and predictability.",
  },
] as const;

export const memoryMetadataFields = [
  { id: "with", label: "Who were you with?" },
  { id: "where", label: "Where were you?" },
  { id: "doing", label: "What were you doing?" },
  { id: "special", label: "What made it special?" },
] as const;

export const memoryStoryPrompt = "Tell the story. What happened?";
export const customLifePrompt = "None of these? Describe another life";
export const threeLifePrompts = {
  attracts: "What attracts you?",
  repels: "What would you hate?",
} as const;
export const goalPrompts = {
  goal: "What do you think you want?",
  why: "Why? What would that give you?",
} as const;
export const tradeoffScaleLabels = {
  left: "lean left",
  middle: "genuinely torn",
  right: "lean right",
  untouched: "Move or tap the slider to choose",
  chosen: "Choice made",
} as const;

export const seedPersonas = [
  { id: "burned_out", label: "Career-focused but burned out" },
  {
    id: "freedom_relationships",
    label: "Freedom-oriented but afraid of losing relationships",
  },
  {
    id: "stable_adventure",
    label: "Stable life but unsure whether they want more adventure",
  },
] as const;

export function getQuestionById(id: string): AssessmentQuestion | undefined {
  return assessmentQuestions.find((question) => question.id === id);
}

export function getQuestionIndex(questionId: string): number {
  return assessmentQuestions.findIndex(
    (question) => question.id === questionId,
  );
}
