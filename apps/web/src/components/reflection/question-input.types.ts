import type { AssessmentQuestion, Locale } from "@wtfiwant/shared";

export type QuestionInputProps = {
  question: AssessmentQuestion;
  locale: Locale;
  value: unknown;
  onChange: (value: unknown) => void;
};

export type AnswerInputProps = Omit<QuestionInputProps, "question">;

export const questionInputClassName =
  "w-full rounded-2xl border border-ink/15 bg-paper px-5 py-4 text-lg leading-relaxed outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-ink/30 focus:border-accent focus:bg-white/40 focus:ring-4 focus:ring-accent/10";
