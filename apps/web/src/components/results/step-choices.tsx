import type { Analysis } from "@wtfiwant/shared";

type StepChoicesProps = {
  steps: Analysis["firstSteps"];
  selected: number;
  onChoose: (index: number) => void;
};

export function StepChoices({ steps, selected, onChoose }: StepChoicesProps) {
  return (
    <div className="step-choices">
      {steps.map((candidate, index) => (
        <button
          className={selected === index ? "selected" : ""}
          type="button"
          key={candidate.direction}
          onClick={() => onChoose(index)}
        >
          <span>DIRECTION {index + 1}</span>
          <strong>{candidate.direction}</strong>
        </button>
      ))}
    </div>
  );
}
