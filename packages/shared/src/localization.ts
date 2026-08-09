import { z } from "zod";

export const localeSchema = z.enum(["en", "de"]);
export type Locale = z.infer<typeof localeSchema>;

export const locales = localeSchema.options;
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return localeSchema.safeParse(value).success;
}

type QuestionTranslation = {
  prompt: string;
  description?: string;
  placeholder?: string;
  options?: readonly string[];
  otherLabel?: string;
  otherPlaceholder?: string;
};

export type AssessmentTranslation = {
  chapters: ReadonlyArray<{ label: string; eyebrow: string }>;
  questions: Readonly<Record<string, QuestionTranslation>>;
  tradeoffPairs: ReadonlyArray<readonly [string, string]>;
  threeLives: ReadonlyArray<{ name: string; description: string }>;
  memoryMetadataFields: readonly string[];
  memoryStoryPrompt: string;
  customLifePrompt: string;
  threeLifePrompts: { attracts: string; repels: string };
  goalPrompts: { goal: string; why: string };
  tradeoffScaleLabels: {
    left: string;
    middle: string;
    right: string;
    untouched: string;
    chosen: string;
  };
};

const germanAssessment: AssessmentTranslation = {
  chapters: [
    { label: "DU", eyebrow: "Beginne mit dem, was wirklich da ist." },
    { label: "LEBENDIG", eyebrow: "Suche nach gelebten Hinweisen." },
    {
      label: "RAUSCHEN",
      eyebrow: "Trenne eigene Wünsche von fremden Erwartungen.",
    },
    {
      label: "MÖGLICHKEITEN",
      eyebrow: "Achte auf die Eigenschaften, nicht auf das Klischee.",
    },
    {
      label: "ABWÄGUNGEN",
      eyebrow: "Eine Vorliebe ohne Preis sagt uns wenig.",
    },
    {
      label: "ANTI-LEBEN",
      eyebrow: "Ein klares Nein kann hilfreicher sein als ein vages Ja.",
    },
    { label: "ZIELE", eyebrow: "Jetzt können wir fragen, was du willst." },
  ],
  questions: {
    "life.energy": {
      prompt: "Was beansprucht gerade den Großteil deiner Zeit und Energie?",
      description:
        "Wähle alles, was wirklich Raum einnimmt – nicht nur das, was dir am wichtigsten ist.",
      options: [
        "Arbeit",
        "Partner:in",
        "Familie",
        "Freund:innen",
        "Kinder",
        "Gesundheit / Fitness",
        "Geld",
        "Etwas aufbauen",
        "Lernen / Studium",
        "Soziale Medien / Unterhaltung",
        "Reisen",
      ],
      otherLabel: "Etwas anderes",
      otherPlaceholder: "Was kostet dich sonst noch Energie?",
    },
    "life.chosen": {
      prompt:
        "Welcher Teil deines jetzigen Lebens fühlt sich am stärksten nach einer bewussten Entscheidung an?",
      placeholder: "Der Teil, den du selbst gestaltet hast …",
    },
    "life.drifted": {
      prompt: "In welchem Teil bist du irgendwie einfach gelandet?",
      placeholder: "Was sich einfach so ergeben hat …",
    },
    "alive.memories": {
      prompt: "Wann hast du dich wirklich lebendig gefühlt?",
      description:
        "Denke an die letzten Jahre. Beschreibe bis zu drei echte Momente, in denen du dich erfüllt, stolz, ruhig oder tief glücklich gefühlt hast. Eine ehrliche Erinnerung reicht, um weiterzumachen.",
    },
    "noise.working_toward": {
      prompt: "Worauf arbeitest du gerade hin?",
      placeholder:
        "Eine Beförderung, ein Zuhause, ein anderer Körper, mehr Freiheit …",
    },
    "noise.private_desire": {
      prompt:
        "Wenn niemals jemand erfahren könnte, dass du es erreicht hast – würdest du es trotzdem wollen?",
      options: [
        "Auf jeden Fall",
        "Wahrscheinlich",
        "Ich bin nicht sicher",
        "Wahrscheinlich nicht",
        "Auf keinen Fall",
      ],
    },
    "noise.supposed": {
      prompt: "Was glaubst du, wollen zu sollen?",
      description:
        "Karriere, Haus, Ehe, Kinder, Geld, Status, Reisen, Unternehmertum, Fitness …",
    },
    "noise.jealous": {
      prompt:
        "Auf wessen Leben bist du ein wenig neidisch – und was genau daran möchtest du?",
      description:
        "Neid ist hier ein Hinweis, kein Charakterfehler. Benenne die konkrete Eigenschaft.",
    },
    "possibilities.three_lives": {
      prompt: "Drei Leben. Was zieht dich an – und was stößt dich ab?",
      description:
        "Du entscheidest dich nicht für ein Gesamtpaket. Du suchst nach Zutaten.",
    },
    "tradeoffs.choices": {
      prompt:
        "Wähle die Richtung, zu der du tendierst – auch wenn du beides willst.",
      description:
        "Das sind Signale, kein Persönlichkeitstest. Die Mitte ist erlaubt, wenn sie ehrlich ist.",
    },
    "tradeoffs.accepted_downside": {
      prompt:
        "Welchen Nachteil würdest du für ein Leben, das du wirklich willst, am ehesten akzeptieren?",
      description:
        "Jedes Leben hat einen Preis. Welcher Preis könnte es wirklich wert sein?",
    },
    "anti_life.regret": {
      prompt: "Was würde am meisten wehtun, wenn du es nie versucht hättest?",
      description: "Stell dir vor, du bist viel älter und blickst zurück.",
    },
    "anti_life.repeated_year": {
      prompt:
        "Stell dir vor, die nächsten zehn Jahre sehen fast genauso aus wie das letzte. Was daran macht dir Angst?",
    },
    "anti_life.description": {
      prompt: "Das Leben, das ich nicht will",
      description:
        "Vielleicht wartest du immer aufs Wochenende, hast Geld, aber keine Zeit, bist allein oder gefangen oder lebst hauptsächlich für die Erwartungen anderer. Beschreibe dein Anti-Leben.",
      placeholder:
        "Ein konkretes Bild des Lebens, in das du nicht schlafwandeln willst …",
    },
    "goals.current": {
      prompt: "Welche drei Dinge glaubst du im Moment zu wollen?",
      description:
        "Ein bis drei reichen. Gehe bei jedem Ziel eine Ebene tiefer als die sichtbare Form.",
    },
  },
  tradeoffPairs: [
    ["Mehr Freiheit", "Mehr Sicherheit"],
    ["Mehr Zeit", "Mehr Geld"],
    ["Abenteuer", "Stabilität"],
    ["Erfolg", "Wenig Stress"],
    ["An einem aufregenden Ort leben", "Nah bei geliebten Menschen leben"],
    ["Etwas Sinnvolles aufbauen", "Freie Zeit schützen"],
  ],
  threeLives: [
    {
      name: "Leben A — Wurzeln",
      description:
        "Ein stabiles Zuhause. Geliebte Menschen in der Nähe. Planbarkeit. Eine starke Gemeinschaft. Weniger Neues.",
    },
    {
      name: "Leben B — Freiheit",
      description:
        "Fast überall leben. Wenig Besitz. Wechselnde Umgebungen. Viel Selbstbestimmung. Weniger Stabilität.",
    },
    {
      name: "Leben C — Aufbau",
      description:
        "Jahre damit verbringen, etwas Ambitioniertes aufzubauen. Große Herausforderungen. Möglicher finanzieller Erfolg. Weniger Freizeit und Planbarkeit.",
    },
  ],
  memoryMetadataFields: [
    "Mit wem warst du dort?",
    "Wo warst du?",
    "Was hast du gemacht?",
    "Was machte den Moment besonders?",
  ],
  memoryStoryPrompt: "Erzähle die Geschichte. Was ist passiert?",
  customLifePrompt: "Keines davon? Beschreibe ein anderes Leben",
  threeLifePrompts: {
    attracts: "Was zieht dich an?",
    repels: "Was würdest du hassen?",
  },
  goalPrompts: {
    goal: "Was glaubst du zu wollen?",
    why: "Warum? Was würde dir das geben?",
  },
  tradeoffScaleLabels: {
    left: "eher links",
    middle: "wirklich unentschieden",
    right: "eher rechts",
    untouched: "Bewege oder tippe den Regler, um zu wählen",
    chosen: "Auswahl getroffen",
  },
};

export function getGermanAssessmentTranslation(): AssessmentTranslation {
  return germanAssessment;
}
