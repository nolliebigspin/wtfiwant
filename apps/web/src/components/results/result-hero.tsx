import type { Analysis } from "@wtfiwant/shared";

export function ResultHero({ summary }: { summary: Analysis["summary"] }) {
  return (
    <section className="result-hero">
      <p className="eyebrow">YOUR ANSWERS, READ BACK CAREFULLY</p>
      <h1>Your Compass</h1>
      <p className="result-caveat">
        This isn't who you are. It's our best interpretation of what you told
        us. Keep what feels true. Challenge what doesn't.
      </p>
      <p className="result-summary">{summary}</p>
    </section>
  );
}
