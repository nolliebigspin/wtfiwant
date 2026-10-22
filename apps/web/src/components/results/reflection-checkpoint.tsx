import type { Checkpoint, Locale, SessionView } from "@wtfiwant/shared";
import { useState } from "react";
import { formatOffer, usePurchaseOffer } from "@/components/purchase-offer";
import { primaryButtonClassName, secondaryButtonClassName } from "@/lib/styles";
import { ResultShell } from "./result-shell";

export function ReflectionCheckpoint({
  checkpoint,
  sessionId,
  view,
  purchasing,
  error,
  onPurchase,
}: {
  checkpoint: Checkpoint;
  sessionId: string;
  view: SessionView;
  purchasing: boolean;
  error: string | null;
  onPurchase: () => void;
}) {
  const locale: Locale = checkpoint.locale;
  const de = locale === "de";
  const offer = usePurchaseOffer();
  const [note, setNote] = useState("");
  return (
    <ResultShell>
      <main className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <p className="mb-5 text-xs font-bold tracking-[0.2em] text-accent-ink uppercase">
          {de ? "Dein kostenloser Zwischenstand" : "Your free checkpoint"}
        </p>
        <h1 className="max-w-3xl text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.06em]">
          {de ? "Was du schon weißt." : "What you already know."}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          {de
            ? "Hier stehen deine eigenen Antworten nebeneinander. Keine Bewertung, kein Persönlichkeitstest: Nimm dir einen Moment und schau, was zusammenpasst und was sich reibt."
            : "Here are your own answers, side by side. No score or personality test: take a moment to notice what fits together and what pulls in different directions."}
        </p>
        <div className="my-10 grid gap-4 md:grid-cols-2">
          {checkpoint.cards.map((card) => (
            <article
              key={card.id}
              className="rounded-2xl border border-ink/15 bg-paper p-6"
            >
              <h2 className="mb-4 text-sm font-bold text-muted">
                {card.title}
              </h2>
              <p className="max-h-64 overflow-auto text-lg whitespace-pre-wrap">
                {card.answer}
              </p>
            </article>
          ))}
        </div>
        <section className="rounded-2xl border border-ink/15 p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold">
            {de ? "Deine gewählten Prioritäten" : "Your stated priorities"}
          </h2>
          <p className="mb-7 text-sm text-muted">
            {de
              ? "Die Positionen zeigen deine Auswahl, keine berechneten Werte."
              : "The positions show your choices, not calculated scores."}
          </p>
          <div className="space-y-6">
            {checkpoint.tradeoffs.map((pair) => (
              <div key={pair.left}>
                <div className="mb-2 flex justify-between gap-4 text-sm">
                  <span>{pair.left}</span>
                  <span className="text-right">{pair.right}</span>
                </div>
                <div
                  className="relative h-2 rounded-full bg-ink/10"
                  role="img"
                  aria-label={`${pair.left} / ${pair.right}: ${pair.value === 0 ? (de ? "unentschieden" : "torn") : pair.value < 0 ? pair.left : pair.right}`}
                >
                  <span
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-ink"
                    style={{ left: `${(pair.value + 2) * 25}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="my-8 rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <p className="mb-3 text-xs tracking-widest uppercase">
            {de ? "Eine Frage zum Mitnehmen" : "A question to take with you"}
          </p>
          <h2 className="max-w-2xl text-2xl leading-snug">
            {checkpoint.reflectionPrompt}
          </h2>
          <label className="mt-6 block text-sm" htmlFor="checkpoint-note">
            {de
              ? "Eine private Notiz für jetzt (optional, wird nicht gespeichert)"
              : "A private note for now (optional, not saved)"}
          </label>
          <textarea
            id="checkpoint-note"
            className="mt-2 min-h-24 w-full rounded-lg border border-paper/30 bg-paper/10 p-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={3000}
          />
        </section>
        <a
          className={secondaryButtonClassName}
          href={`/${locale}/reflection/${sessionId}?edit=1`}
        >
          {de ? "Antworten ansehen oder ändern" : "Review or edit your answers"}
        </a>
        <section className="mt-16 rounded-3xl border border-ink/20 bg-paper p-7 sm:p-12">
          <p className="mb-4 text-xs font-bold tracking-widest text-accent-ink uppercase">
            {de
              ? "Wenn du tiefer gehen möchtest"
              : "When you want to go further"}
          </p>
          <h2 className="text-4xl leading-tight tracking-tight">
            {de
              ? "Von deinen Antworten zu einem nächsten Schritt."
              : "From your answers to a next step."}
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">
            {de
              ? "Nach dem Kauf helfen dir bis zu fünf optionale Rückfragen, deine Richtung zu klären. Du prüfst und korrigierst deinen Nordstern. Daraus entstehen dein 90-Tage-Ziel, ein Vier-Wochen-Plan und konkrete Entscheidungsregeln — mit Belegen aus deinen Antworten."
              : "After purchase, up to five optional follow-up questions help clarify your direction. Review and correct your north star, then receive a 90-day goal, a four-week plan and practical decision rules, grounded in your answers."}
          </p>
          <ul className="my-7 grid gap-3 text-sm sm:grid-cols-2">
            {(de
              ? [
                  "Deine Muster mit Belegen",
                  "Konkrete, reversible nächste Schritte",
                  "Gut lesbarer Bericht und PDF",
                  "Zustellung an deine Checkout-E-Mail",
                ]
              : [
                  "Your patterns with supporting evidence",
                  "Concrete, reversible next steps",
                  "Readable report and downloadable PDF",
                  "Delivery to your checkout email",
                ]
            ).map((item) => (
              <li key={item}>✦ {item}</li>
            ))}
          </ul>
          {offer ? (
            <p className="mb-5 text-2xl font-bold">
              {formatOffer(offer, locale)}{" "}
              <span className="text-sm font-normal text-muted">
                {de ? "einmalig · kein Abo" : "once · no subscription"}
              </span>
            </p>
          ) : null}
          {view.checkoutAvailable ? (
            <>
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={purchasing}
                onClick={onPurchase}
              >
                {purchasing
                  ? de
                    ? "Checkout wird geöffnet…"
                    : "Opening checkout…"
                  : de
                    ? "Meinen KI-Kompass freischalten"
                    : "Unlock my AI Compass"}
              </button>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {de
                  ? "Der Gesamtpreis steht vor der Zahlung im Stripe-Checkout. Dort bestätigst du die sofortige digitale Bereitstellung. Bitte verwende eine E-Mail-Adresse, auf die nur du Zugriff hast."
                  : "The total is shown before payment in Stripe Checkout. There you agree to immediate digital delivery. Please use an email address only you can access."}
              </p>
              <p className="mt-3 text-xs">
                <a href={view.legalLinks?.termsUrl}>
                  {de ? "Nutzungsbedingungen" : "Terms"}
                </a>{" "}
                ·{" "}
                <a href={view.legalLinks?.refundPolicyUrl}>
                  {de ? "Widerruf und Erstattungen" : "Withdrawal and refunds"}
                </a>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              {de
                ? "Der kostenpflichtige KI-Kompass ist noch nicht verfügbar. Dein kostenloser Zwischenstand bleibt zugänglich."
                : "The paid AI Compass is not available yet. Your free checkpoint remains accessible."}
            </p>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </section>
      </main>
    </ResultShell>
  );
}
