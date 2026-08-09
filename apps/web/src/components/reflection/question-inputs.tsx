"use client";

import { ChoiceQuestion } from "./choice-question";
import { GoalsQuestion } from "./goals-question";
import { LongTextQuestion } from "./long-text-question";
import { MemoriesQuestion } from "./memories-question";
import type { QuestionInputProps } from "./question-input.types";
import { ThreeLivesQuestion } from "./three-lives-question";
import { TradeoffsQuestion } from "./tradeoffs-question";

export function QuestionInput(props: QuestionInputProps) {
  switch (props.question.type) {
    case "long_text":
      return (
        <LongTextQuestion
          value={props.value}
          onChange={props.onChange}
          placeholder={props.question.placeholder}
          label={props.question.prompt}
        />
      );
    case "multi_choice":
    case "single_choice":
      return <ChoiceQuestion {...props} />;
    case "memories":
      return <MemoriesQuestion value={props.value} onChange={props.onChange} />;
    case "three_lives":
      return (
        <ThreeLivesQuestion value={props.value} onChange={props.onChange} />
      );
    case "tradeoffs":
      return (
        <TradeoffsQuestion value={props.value} onChange={props.onChange} />
      );
    case "goals":
      return <GoalsQuestion value={props.value} onChange={props.onChange} />;
  }
}
