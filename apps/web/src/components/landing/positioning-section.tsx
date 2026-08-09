import { darkEyebrowClassName } from "@/lib/styles";

const principles = [
  {
    title: "Look at evidence",
    description:
      "Real moments when you felt alive, not abstract values you think you should choose.",
  },
  {
    title: "Cut through noise",
    description:
      "Separate what you want from what parents, status, LinkedIn, or Instagram taught you to want.",
  },
  {
    title: "Pay the price",
    description:
      "Choose between competing goods. Every life has a cost; vague preference is cheap.",
  },
  {
    title: "Do one real thing",
    description:
      "Turn the pattern into a reversible experiment and a next action small enough to begin.",
  },
];

export function PositioningSection() {
  return (
    <section
      className="grid grid-cols-[0.8fr_1.2fr] gap-24 bg-ink px-[clamp(1.2rem,7vw,8rem)] py-[clamp(5rem,9vw,9rem)] text-white max-[800px]:grid-cols-1 max-[800px]:gap-16"
      id="what-this-is"
    >
      <div>
        <p className={darkEyebrowClassName}>NOT ANOTHER PERSONALITY TEST</p>
        <h2 className="m-0 text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.95] tracking-[-0.065em]">
          Stop. Understand.
          <br />
          <em className="font-[Georgia,serif] font-normal text-acid">
            Then start.
          </em>
        </h2>
      </div>
      <div className="grid grid-cols-2 max-[520px]:grid-cols-1">
        {principles.map((principle, index) => (
          <article
            className="min-h-56 border-t border-white/22 py-6 pr-8 pb-8 even:border-l even:pl-8 max-[520px]:even:border-l-0 max-[520px]:even:pl-0"
            key={principle.title}
          >
            <span className="text-[0.7rem] font-black tracking-[0.18em] text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-[2.7rem] mb-[0.7rem] text-2xl">
              {principle.title}
            </h3>
            <p className="leading-relaxed text-white/62">
              {principle.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
