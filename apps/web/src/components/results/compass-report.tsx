import {
  type Analysis,
  buildCompassSections,
  type Compass,
  compassHeadline,
  directionStatusLabel,
  type Locale,
} from "@wtfiwant/shared";
import { EvidenceDrawer } from "./evidence-drawer";

export function CompassReport({
  compass,
  status,
  locale,
  answers,
}: {
  compass: Compass;
  status: NonNullable<Analysis["directionStatus"]>;
  locale: Locale;
  answers: Record<string, unknown>;
}) {
  const de = locale === "de";
  return (
    <>
      <section className="bg-ink px-6 py-20 text-paper sm:px-10 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold tracking-widest text-acid uppercase">
            {de ? "Dein persönlicher Kompass" : "Your personal Compass"}
          </p>
          <h1 className="mt-8 max-w-3xl text-5xl leading-tight tracking-tight sm:text-7xl">
            {compassHeadline(status, locale)}
          </h1>
          <p className="mt-10 max-w-4xl font-serif text-2xl leading-relaxed sm:text-3xl">
            {compass.northStar}
          </p>
          <p className="mt-5 text-xs font-bold text-acid">
            {directionStatusLabel(status, locale)}
          </p>
          <div className="relative mt-12 grid gap-6 border-t border-paper/20 pt-8 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-bold tracking-wider uppercase">
                {de
                  ? "Deine wichtigste Veränderung jetzt"
                  : "Your most important change now"}
              </h2>
              <p className="mt-3 text-lg leading-relaxed">{compass.priority}</p>
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wider uppercase">
                {de ? "Dein 90-Tage-Ziel" : "Your 90-day goal"}
              </h2>
              <p className="mt-3 text-lg leading-relaxed">
                {compass.goal.outcome}
              </p>
            </div>
          </div>
          <div className="mt-10 rounded-xl border border-acid/40 bg-paper/5 p-6">
            <h2 className="text-sm font-bold text-acid">
              {de ? "Dein nächster Schritt" : "Your next step"}
            </h2>
            <p className="mt-3 text-xl">{compass.firstAction.action}</p>
            <p className="mt-3 text-sm text-paper/70">
              {compass.firstAction.when} · {compass.firstAction.doneWhen}
            </p>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-paper/70">
            {de
              ? "Ein Plan zum Ausprobieren und Anpassen. Dein Leben darf sich ändern — und deine Richtung mit ihm. Zeitangaben und Schritte sind Vorschläge, sofern du sie nicht selbst festgelegt hast."
              : "A plan to try and adapt. Your life can change, and so can your direction. Timings and steps are proposals unless you specified them yourself."}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        {buildCompassSections(compass, locale).map((section, index) => (
          <section
            key={section.title}
            className="border-b border-ink/15 py-14 sm:py-20"
          >
            <p className="text-xs font-bold tracking-widest text-accent-ink">
              0{index + 1}
            </p>
            <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
              {section.title}
            </h2>
            {section.kind === "roadmap" ? (
              <CompassTimeline weeks={compass.weeks} locale={locale} />
            ) : (
              <div className="mt-9 grid gap-6 sm:grid-cols-2">
                {section.items.map((item) => (
                  <article
                    key={`${item.title ?? ""}|${item.paragraphs.join("|")}`}
                    className="rounded-xl border border-ink/10 bg-white/40 p-6"
                  >
                    {item.title ? (
                      <h3 className="text-lg font-bold leading-snug">
                        {item.title}
                      </h3>
                    ) : null}
                    {item.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-muted"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {item.evidenceQuestionIds.length ? (
                      <EvidenceDrawer
                        ids={item.evidenceQuestionIds}
                        answers={answers}
                      />
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function CompassTimeline({
  weeks,
  locale,
}: {
  weeks: Compass["weeks"];
  locale: Locale;
}) {
  const de = locale === "de";
  return (
    <figure className="mt-10">
      <figcaption className="mb-7 text-sm text-muted">
        {de
          ? "Vier Etappen für deinen Alltag. Reihenfolge und Umfang darfst du anpassen."
          : "Four stages for your everyday life. Adapt the sequence and scope to your circumstances."}
      </figcaption>
      <ol className="ml-5 border-l border-accent-ink/30">
        {weeks.map((week) => (
          <li key={week.week} className="relative pb-8 pl-10 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute -left-5 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper"
            >
              {week.week}
            </span>
            <article className="rounded-xl border border-ink/10 bg-white/60 p-6 sm:p-8">
              <p className="text-xs font-bold tracking-widest text-accent-ink uppercase">
                {de ? "Woche" : "Week"} {week.week}
              </p>
              <h3 className="mt-3 font-serif text-2xl leading-snug">
                {week.focus.replace(/[.!]$/, "")}
              </h3>
              <p className="mt-4 leading-relaxed text-muted">{week.action}</p>
              <p className="mt-6 border-t border-ink/10 pt-4 text-sm leading-relaxed">
                <strong>{de ? "Erledigt, wenn: " : "Done when: "}</strong>
                {week.doneWhen}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </figure>
  );
}
