import type { ActionPlanInput } from "@wtfiwant/shared";
import { eyebrowClassName, fieldControlClassName } from "@/lib/styles";

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
    <div className="mt-12 rounded-[1.3rem] border border-ink/20 p-[clamp(1.2rem,4vw,3rem)]">
      <p className={eyebrowClassName}>
        MAKE A PLAN FOR THE MOMENT MOTIVATION DISAPPEARS
      </p>
      <label>
        <span className="mb-3 block font-extrabold">
          What's most likely to stop you?
        </span>
        <select
          className={fieldControlClassName}
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
      <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[800px]:grid-cols-1">
        <label>
          <span className="mb-3 block font-extrabold">If</span>
          <textarea
            className={`${fieldControlClassName} min-h-32 resize-y`}
            aria-label="If"
            value={form.ifCondition}
            onChange={(event) => onChange("ifCondition", event.target.value)}
            placeholder="I get home and automatically open Instagram…"
          />
        </label>
        <div className="text-3xl text-accent max-[800px]:justify-self-center max-[800px]:rotate-90">
          →
        </div>
        <label>
          <span className="mb-3 block font-extrabold">Then</span>
          <textarea
            className={`${fieldControlClassName} min-h-32 resize-y`}
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
