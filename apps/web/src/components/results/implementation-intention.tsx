import type { ActionPlanInput } from "@wtfiwant/shared";

const obstacles = [
  "I'm tired after work",
  "Social media",
  "I overthink things",
  "I don't know where to start",
  "I'm afraid I'll fail",
  "I always postpone it",
  "Other",
];

type ImplementationIntentionProps = {
  form: ActionPlanInput;
  onChange: (key: keyof ActionPlanInput, value: string) => void;
};

export function ImplementationIntention({
  form,
  onChange,
}: ImplementationIntentionProps) {
  return (
    <div className="intention-card">
      <p className="eyebrow">
        MAKE A PLAN FOR THE MOMENT MOTIVATION DISAPPEARS
      </p>
      <label>
        <span>What's most likely to stop you?</span>
        <select
          aria-label="What's most likely to stop you?"
          value={form.obstacle}
          onChange={(event) => onChange("obstacle", event.target.value)}
        >
          <option value="">Choose the honest obstacle</option>
          {obstacles.map((obstacle) => (
            <option key={obstacle}>{obstacle}</option>
          ))}
        </select>
      </label>
      <div className="if-then">
        <label>
          <span>If</span>
          <textarea
            aria-label="If"
            value={form.ifCondition}
            onChange={(event) => onChange("ifCondition", event.target.value)}
            placeholder="I get home and automatically open Instagram…"
          />
        </label>
        <div className="then-arrow">→</div>
        <label>
          <span>Then</span>
          <textarea
            aria-label="Then"
            value={form.thenAction}
            onChange={(event) => onChange("thenAction", event.target.value)}
            placeholder="I'll first spend ten minutes on the next step…"
          />
        </label>
      </div>
    </div>
  );
}
