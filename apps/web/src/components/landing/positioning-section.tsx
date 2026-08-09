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
    <section className="positioning" id="what-this-is">
      <div className="positioning-lead">
        <p className="eyebrow">NOT ANOTHER PERSONALITY TEST</p>
        <h2>
          Stop. Understand.
          <br />
          <em>Then start.</em>
        </h2>
      </div>
      <div className="positioning-grid">
        {principles.map((principle, index) => (
          <article key={principle.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{principle.title}</h3>
            <p>{principle.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
