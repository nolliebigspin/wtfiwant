"use client";

import type { DirectionDraft, DirectionReview, Locale } from "@wtfiwant/shared";
import { useState } from "react";
import { primaryButtonClassName } from "@/lib/styles";

export function DirectionReviewForm({
  draft,
  locale,
  onSubmit,
}: {
  draft: DirectionDraft;
  locale: Locale;
  onSubmit: (review: DirectionReview) => Promise<void>;
}) {
  const de = locale === "de";
  const [alignment, setAlignment] = useState<
    DirectionReview["alignment"] | null
  >(null);
  const [northStar, setNorthStar] = useState(draft.northStar);
  const [priority, setPriority] = useState(draft.priority);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const edited = northStar !== draft.northStar || priority !== draft.priority;
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!alignment) return;
        setBusy(true);
        setError(false);
        try {
          await onSubmit({
            alignment,
            northStar: northStar.trim(),
            priority: priority.trim(),
            feedback: feedback.trim(),
          });
        } catch {
          setError(true);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">
        {de
          ? "Ist das, was du wirklich willst?"
          : "Is this what you actually want?"}
      </h1>
      <p className="my-6 text-muted">
        {de
          ? "Ein Vorschlag aus deinen Antworten. Du entscheidest, was passt. Korrigiere ihn oder lass die Richtung bewusst offen."
          : "A proposal drawn from your answers. You decide what fits. Correct it, or keep the direction deliberately open."}
      </p>
      <label htmlFor="north-star" className="mt-8 block text-sm font-bold">
        {de
          ? "Dein Nordstern · Wie du leben möchtest"
          : "Your north star · How you want to live"}
      </label>
      <textarea
        id="north-star"
        value={northStar}
        maxLength={1200}
        minLength={5}
        required
        onChange={(e) => {
          setNorthStar(e.target.value);
          if (alignment === "fits") setAlignment("adjusted");
        }}
        className="mt-3 min-h-32 w-full rounded-xl border border-ink/20 bg-paper p-4 font-serif text-xl leading-relaxed"
      />
      <label
        htmlFor="compass-priority"
        className="mt-6 block text-sm font-bold"
      >
        {de
          ? "Deine wichtigste Veränderung jetzt"
          : "Your most important change now"}
      </label>
      <textarea
        id="compass-priority"
        value={priority}
        maxLength={1200}
        minLength={5}
        required
        onChange={(e) => {
          setPriority(e.target.value);
          if (alignment === "fits") setAlignment("adjusted");
        }}
        className="mt-3 min-h-24 w-full rounded-xl border border-ink/20 p-4"
      />
      <details className="my-6 border-l-2 border-accent p-4">
        <summary className="cursor-pointer text-sm font-bold">
          {de ? "Warum diese Richtung?" : "Why this direction?"}
        </summary>
        <p className="mt-3 leading-relaxed">{draft.why}</p>
        <p className="mt-3 text-sm text-muted">{draft.uncertainty}</p>
      </details>
      <fieldset className="mt-8">
        <legend className="mb-3 font-bold">
          {de ? "Wie gut passt das?" : "How well does this fit?"}
        </legend>
        {(["fits", "adjusted", "unsure"] as const).map((value, index) => (
          <label
            key={value}
            className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-ink/15 p-4 has-checked:border-accent-ink has-checked:bg-accent/10"
          >
            <input
              className="mt-1"
              type="radio"
              name="alignment"
              value={value}
              checked={alignment === value}
              disabled={value === "fits" && edited}
              required
              onChange={() => setAlignment(value)}
            />
            <span>
              {
                (de
                  ? [
                      "Das passt zu mir.",
                      "Teilweise — ich habe etwas korrigiert oder möchte etwas ergänzen.",
                      "Ich bin noch unsicher. Ich möchte diese Richtung erst erkunden.",
                    ]
                  : [
                      "This fits me.",
                      "Partly — I have corrected something or want to add something.",
                      "I am still unsure. I want to explore this direction first.",
                    ])[index]
              }
            </span>
          </label>
        ))}
      </fieldset>
      <label
        htmlFor="direction-feedback"
        className="mt-6 block text-sm font-bold"
      >
        {de
          ? "Was fehlt oder ist noch unklar?"
          : "What is missing or still uncertain?"}
        {alignment === "fits" ? (de ? " (optional)" : " (optional)") : ""}
      </label>
      <textarea
        id="direction-feedback"
        value={feedback}
        maxLength={2000}
        required={alignment !== "fits"}
        minLength={alignment === "fits" ? undefined : 5}
        onChange={(e) => setFeedback(e.target.value)}
        className="mt-3 min-h-24 w-full rounded-xl border border-ink/20 p-4"
      />
      <button
        type="submit"
        className={`${primaryButtonClassName} mt-7`}
        disabled={
          busy ||
          !alignment ||
          northStar.trim().length < 5 ||
          priority.trim().length < 5 ||
          (alignment !== "fits" && feedback.trim().length < 5)
        }
      >
        {busy
          ? de
            ? "Wird gespeichert…"
            : "Saving…"
          : de
            ? "Diese Richtung für meinen Plan verwenden"
            : "Use this direction to build my plan"}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        {de
          ? "Deine Formulierungen bleiben erhalten. Daraus entstehen ein 90-Tage-Ziel und ein anpassbarer Vier-Wochen-Plan. Ein noch unsicherer Nordstern bleibt im Bericht als vorläufig gekennzeichnet."
          : "Your wording will be preserved. We will build a 90-day goal and an adaptable four-week plan around it. A direction you are unsure about stays labelled as provisional."}
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-red-800">
          {de
            ? "Speichern fehlgeschlagen. Deine Zahlung ist gespeichert. Bitte versuche es erneut."
            : "Could not save. Your payment is saved. Please try again."}
        </p>
      ) : null}
    </form>
  );
}
