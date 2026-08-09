const facts = [
  ["20–30", "minutes, roughly"],
  ["0", "right answers"],
  ["AI", "finds patterns, not diagnoses"],
  ["NO", "account required"],
] as const;

export function LandingFacts() {
  return (
    <section className="landing-facts">
      {facts.map(([value, label]) => (
        <div key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}
