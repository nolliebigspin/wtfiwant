"use client";

import { getLocalizedQuestion } from "@/lib/assessment-i18n";
import { ChoiceQuestion } from "./choice-question";
import { GoalsQuestion } from "./goals-question";
import { LongTextQuestion } from "./long-text-question";
import { MemoriesQuestion } from "./memories-question";
import type { QuestionInputProps } from "./question-input.types";
import { ThreeLivesQuestion } from "./three-lives-question";
import { TradeoffsQuestion } from "./tradeoffs-question";

export function QuestionInput(props: QuestionInputProps) {
  const localizedQuestion = getLocalizedQuestion(props.question, props.locale);
  switch (props.question.type) {
    case "long_text":
      return (
        <LongTextQuestion
          value={props.value}
          onChange={props.onChange}
          locale={props.locale}
          placeholder={
            localizedQuestion.type === "long_text"
              ? localizedQuestion.placeholder
              : undefined
          }
          label={localizedQuestion.prompt}
        />
      );
    case "multi_choice":
    case "single_choice":
      return <ChoiceQuestion {...props} />;
    case "memories":
      return (
        <MemoriesQuestion
          locale={props.locale}
          value={props.value}
          onChange={props.onChange}
        />
      );
    case "three_lives":
      return (
        <ThreeLivesQuestion
          locale={props.locale}
          value={props.value}
          onChange={props.onChange}
        />
      );
    case "tradeoffs":
      return (
        <TradeoffsQuestion
          locale={props.locale}
          value={props.value}
          onChange={props.onChange}
        />
      );
    case "goals":
      return (
        <GoalsQuestion
          locale={props.locale}
          value={props.value}
          onChange={props.onChange}
        />
      );
  }
}
