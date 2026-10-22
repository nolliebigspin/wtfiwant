import { assessmentQuestions, threeLives, tradeoffPairs } from "./assessment";
import { getGermanAssessmentTranslation, type Locale } from "./localization";

const labels: Record<Locale, Record<string, string>> = {
  en: {
    story: "Story",
    with: "With",
    where: "Where",
    doing: "Doing",
    special: "Special",
    memories: "Memories",
    lives: "Lives",
    attracts: "Attracts",
    repels: "Repels",
    customLife: "Alternative life",
    choices: "Choices",
    touched: "Selected",
    goals: "Goals",
    goal: "Goal",
    why: "Why",
    question: "Question",
    answer: "Answer",
    true: "yes",
    false: "no",
  },
  de: {
    story: "Geschichte",
    with: "Mit",
    where: "Ort",
    doing: "Tätigkeit",
    special: "Besonders",
    memories: "Erinnerungen",
    lives: "Leben",
    attracts: "Zieht an",
    repels: "Stößt ab",
    customLife: "Alternatives Leben",
    choices: "Entscheidungen",
    touched: "Ausgewählt",
    goals: "Ziele",
    goal: "Ziel",
    why: "Warum",
    question: "Frage",
    answer: "Antwort",
    true: "ja",
    false: "nein",
  },
};

/** Format saved canonical answers in the report language without rewriting free text. */
export function formatReflectionAnswer(
  answer: unknown,
  locale: Locale,
  noAnswer = locale === "de"
    ? "Keine gespeicherte Antwort."
    : "No saved answer.",
): string {
  const keys = labels[locale];
  const options = new Map<string, string>();
  if (locale === "de") {
    const translated = getGermanAssessmentTranslation();
    for (const question of assessmentQuestions) {
      if (!("options" in question)) continue;
      question.options.forEach((option, index) => {
        options.set(
          option,
          translated.questions[question.id]?.options?.[index] ?? option,
        );
      });
    }
  }
  const format = (value: unknown): string => {
    if (typeof value === "string") return options.get(value) ?? value;
    if (Array.isArray(value)) return value.map(format).join(", ");
    if (value === undefined || value === null) return noAnswer;
    if (typeof value === "object")
      return Object.entries(value)
        .map(([key, item]) => `${keys[key] ?? key}: ${format(item)}`)
        .join(" · ");
    if (typeof value === "boolean") return value ? keys.true : keys.false;
    return String(value);
  };
  return format(answer);
}

/** Human-facing evidence; persistent IDs and form bookkeeping never become copy. */
export function reflectionQuestionLabel(id: string, locale: Locale): string {
  if (id === "direction:review")
    return locale === "de"
      ? "Deine gewählte Richtung"
      : "Your chosen direction";
  const question = assessmentQuestions.find((item) => item.id === id);
  if (!question)
    return locale === "de"
      ? "Deine vertiefende Antwort"
      : "Your follow-up answer";
  return locale === "de"
    ? (getGermanAssessmentTranslation().questions[id]?.prompt ??
        question.prompt)
    : question.prompt;
}

export function formatReportAnswer(
  id: string,
  answer: unknown,
  locale: Locale,
): string {
  const de = locale === "de";
  const translation = getGermanAssessmentTranslation();
  const record =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? (answer as Record<string, unknown>)
      : {};
  const records = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value)
      ? value.filter((item) => item && typeof item === "object")
      : [];
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  if (id === "direction:review" && typeof record.answer === "string")
    return record.answer;
  if (id === "tradeoffs.choices") {
    const choices = Array.isArray(record.choices) ? record.choices : [];
    const touched = Array.isArray(record.touched) ? record.touched : [];
    const pairs = de ? translation.tradeoffPairs : tradeoffPairs;
    return pairs
      .flatMap(([left, right], index) => {
        const choice = choices[index];
        if (typeof choice !== "number" || touched[index] === false) return [];
        const preference =
          choice === 0
            ? de
              ? "zwischen beiden unentschieden"
              : "genuinely torn between both"
            : `${Math.abs(choice) === 2 ? (de ? "klar" : "strongly") : de ? "eher" : "leaning toward"} ${choice < 0 ? left : right}`;
        return [`${left} / ${right}: ${preference}`];
      })
      .join("\n");
  }
  if (id === "alive.memories") {
    return records(record.memories)
      .map((memory, index) =>
        [
          `${de ? "Erinnerung" : "Memory"} ${index + 1}: ${text(memory.story)}`,
          ...["with", "where", "doing", "special"].flatMap((key) =>
            text(memory[key])
              ? [`${labels[locale][key]}: ${text(memory[key])}`]
              : [],
          ),
        ].join("\n"),
      )
      .join("\n\n");
  }
  if (id === "possibilities.three_lives") {
    const lives = records(record.lives).map((life) => {
      const index = threeLives.findIndex((item) => item.id === life.id);
      const name =
        (de ? translation.threeLives[index]?.name : threeLives[index]?.name) ??
        (de ? "Mögliches Leben" : "Possible life");
      return [
        name,
        `${labels[locale].attracts}: ${text(life.attracts)}`,
        `${labels[locale].repels}: ${text(life.repels)}`,
      ].join("\n");
    });
    if (text(record.customLife))
      lives.push(`${labels[locale].customLife}: ${text(record.customLife)}`);
    return lives.join("\n\n");
  }
  if (id === "goals.current") {
    return records(record.goals)
      .map(
        (goal, index) =>
          `${de ? "Ziel" : "Goal"} ${index + 1}: ${text(goal.goal)}\n${labels[locale].why}: ${text(goal.why)}`,
      )
      .join("\n\n");
  }
  const question = assessmentQuestions.find((item) => item.id === id);
  if (typeof answer === "string" && question?.type !== "single_choice")
    return answer;
  if (!question && typeof record.answer === "string") {
    return `${labels[locale].question}: ${text(record.question)}\n${labels[locale].answer}: ${record.answer}`;
  }
  return formatReflectionAnswer(answer, locale);
}
