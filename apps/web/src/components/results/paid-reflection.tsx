"use client";

import type { PaidJourney } from "@wtfiwant/shared";
import { useEffect, useRef, useState } from "react";
import { useAnalyticsEvent } from "@/components/analytics/use-analytics-event";
import { trackAnalytics } from "@/lib/analytics";
import { primaryButtonClassName, secondaryButtonClassName } from "@/lib/styles";
import { DirectionReviewForm } from "./direction-review";
import { ResultShell } from "./result-shell";
import { SafetyResult } from "./result-states";
import type { ResultsClient } from "./results.types";

export function PaidReflection({
  journey,
  sessionId,
  client,
  onUpdate,
}: {
  journey: PaidJourney;
  sessionId: string;
  client: ResultsClient;
  onUpdate: (state: PaidJourney) => void;
}) {
  const de = journey.locale === "de";
  const next = journey.questions.find((q) => !(q.id in journey.responses));
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const step = next
    ? journey.questions.findIndex((question) => question.id === next.id)
    : undefined;
  useAnalyticsEvent(
    "paid_refinement_viewed",
    "result",
    journey.locale,
    step,
    journey.stage === "refining" && Boolean(next),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (next?.id) {
      setResponse("");
      heading.current?.focus();
    }
  }, [next?.id]);
  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await client.synthesizeDirection(sessionId));
    } catch {
      setError(
        de
          ? "Das hat nicht geklappt. Deine Zahlung und Antworten sind gespeichert. Bitte versuche es erneut."
          : "That did not work. Your payment and answers are saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async (answer: string | null) => {
    if (!next) return;
    setBusy(true);
    setError(null);
    try {
      await client.saveRefinement(sessionId, next.id, answer);
      trackAnalytics(
        "paid_refinement_answered",
        "result",
        journey.locale,
        step,
      );
      onUpdate(await client.getPaidJourney(sessionId));
    } catch {
      setError(
        de
          ? "Die Antwort konnte nicht gespeichert werden. Bitte versuche es erneut."
          : "Your answer could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (journey.stage === "safety_paused")
    return (
      <SafetyResult
        message={
          de
            ? "Diese Reflexion wurde wegen eines unmittelbaren Sicherheitshinweises pausiert. Wenn du in unmittelbarer Gefahr bist, kontaktiere den örtlichen Notruf oder eine vertraute Person. Deine Zahlung bleibt gespeichert; bei Zustellproblemen erreichst du uns unter contact@awinter.dev."
            : "This reflection has been paused because of an immediate safety concern. If you are in immediate danger, contact local emergency services or someone you trust. Your payment stays saved; contact contact@awinter.dev for delivery help."
        }
      />
    );
  const waiting =
    journey.stage === "planning" ||
    journey.stage === "synthesizing" ||
    journey.stage === "generating";
  if (journey.stage === "ready")
    return (
      <ResultShell>
        <main className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="text-4xl">
            {de
              ? "Dein fertiger Kompass wird geladen…"
              : "Loading your finished Compass…"}
          </h1>
          <p className="mt-5 text-sm text-muted">
            {de
              ? "Dein Bericht ist gespeichert. Du kannst diese Seite bei Verbindungsproblemen neu laden."
              : "Your report is saved. You can reload this page if the connection is interrupted."}
          </p>
        </main>
      </ResultShell>
    );
  return (
    <ResultShell>
      <main className="mx-auto min-h-[75vh] max-w-3xl px-6 py-16 sm:py-24">
        <p className="mb-5 text-xs font-bold tracking-widest text-accent-ink uppercase">
          {de
            ? "Dein persönlicher Kompass · Zahlung bestätigt"
            : "Your personal Compass · Payment confirmed"}
        </p>
        {journey.stage === "reviewing" && journey.draft ? (
          <DirectionReviewForm
            key={journey.draft.northStar}
            draft={journey.draft}
            locale={journey.locale}
            onSubmit={async (review) => {
              const nextState = await client.generateReport(sessionId, review);
              trackAnalytics(
                "direction_review_saved",
                "result",
                journey.locale,
              );
              onUpdate(nextState);
            }}
          />
        ) : waiting ? (
          <>
            <h1 className="text-5xl leading-tight tracking-tight">
              {journey.purchaseConfirmationPending
                ? de
                  ? "Dein Kauf ist bestätigt."
                  : "Your purchase is confirmed."
                : journey.stage === "planning"
                  ? de
                    ? "Wir schauen genauer hin."
                    : "Let’s look a little closer."
                  : journey.stage === "synthesizing"
                    ? de
                      ? "Eine Richtung zum Prüfen."
                      : "A direction to consider."
                    : de
                      ? "Dein Kompass entsteht."
                      : "Your Compass is taking shape."}
            </h1>
            <output className="my-8 flex items-center gap-3">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-accent-ink" />
              {journey.purchaseConfirmationPending
                ? de
                  ? "Deine Vertragsbestätigung wird versendet. Anschließend starten deine KI-Rückfragen. Bei Verzögerungen erreichst du uns unter contact@awinter.dev."
                  : "Your contract confirmation is being sent. Your AI questions start afterwards. Contact contact@awinter.dev if delivery is delayed."
                : journey.stage === "planning"
                  ? de
                    ? "Passende Rückfragen werden vorbereitet…"
                    : "Preparing relevant follow-up questions…"
                  : journey.stage === "synthesizing"
                    ? de
                      ? "Dein vorläufiger Nordstern wird vorbereitet…"
                      : "Preparing your provisional north star…"
                    : de
                      ? "Deine Antworten werden ausgewertet und Belege geprüft…"
                      : "Reading your answers and checking the supporting evidence…"}
            </output>
            <p className="text-sm leading-relaxed text-muted">
              {de
                ? "Du kannst diese Seite schließen und über deinen gespeicherten Link zurückkehren. Sobald der Bericht fertig ist, wird er auch per E-Mail zugestellt. Deine Zahlung bleibt gespeichert. Nach 30 Minuten ohne weitere Antworten bereiten wir eine vorläufige Richtung vor. Bleibt auch diese 30 Minuten ungeprüft, erstellen wir deinen Bericht ohne Bestätigung; die Richtung bleibt als vorläufig gekennzeichnet."
                : "You can close this page and return using your saved link. Once the report is ready, it will also be delivered by email. Your payment stays saved. After 30 minutes without further answers, we prepare a provisional direction. If it remains unreviewed for another 30 minutes, we create your report without confirmation and label the direction as provisional."}
            </p>
            {journey.canSkip ? (
              <button
                className={`${secondaryButtonClassName} mt-8`}
                disabled={busy}
                type="button"
                onClick={() => void generate()}
              >
                {de
                  ? "Ohne Rückfragen meine Richtung prüfen"
                  : "Review my direction without follow-ups"}
              </button>
            ) : null}
          </>
        ) : journey.stage === "failed" ? (
          <>
            <h1 className="text-4xl">
              {de ? "Dein Kauf ist gespeichert." : "Your purchase is saved."}
            </h1>
            <p className="my-6 leading-relaxed">
              {de
                ? "Die Vorbereitung hat nach mehreren Versuchen nicht geklappt. Du musst nicht noch einmal bezahlen."
                : "Preparation did not succeed after several attempts. You do not need to pay again."}
            </p>
            {journey.canSkip ? (
              <button
                className={primaryButtonClassName}
                disabled={busy}
                type="button"
                onClick={() => void generate()}
              >
                {de
                  ? "Bericht ohne Rückfragen erstellen"
                  : "Create my report without follow-ups"}
              </button>
            ) : (
              <p className="text-sm text-muted">
                {de
                  ? "Bitte kontaktiere uns mit deiner Bestellnummer unter contact@awinter.dev. Wir helfen dir bei der Bereitstellung oder deinen Erstattungsrechten."
                  : "Please contact contact@awinter.dev with your order reference. We can help with delivery or your refund rights."}
              </p>
            )}
          </>
        ) : next ? (
          <>
            <p className="mb-4 text-sm text-muted">
              {de ? "Optionale Vertiefung" : "Optional deeper reflection"} ·{" "}
              {Object.keys(journey.responses).length + 1}/
              {journey.questions.length}
            </p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-4xl leading-tight tracking-tight outline-none"
            >
              {next.question}
            </h1>
            <label
              className="mt-8 block text-sm font-bold"
              htmlFor="paid-answer"
            >
              {de ? "Deine Antwort" : "Your answer"}
            </label>
            <textarea
              id="paid-answer"
              className="mt-3 min-h-40 w-full rounded-xl border border-ink/20 p-4"
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              maxLength={5000}
              placeholder={
                de
                  ? "Ein konkretes Beispiel reicht."
                  : "One concrete example is enough."
              }
            />
            <p className="mt-2 text-xs text-muted">
              {de
                ? "Die Antwort wird beim Weitergehen gespeichert. „Ich weiß es noch nicht“ ist auch eine Antwort. Du kannst jede Frage überspringen."
                : "Your answer is saved when you continue. “I don’t know yet” is a valid answer too. You can skip any question."}
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={busy || !response.trim()}
                onClick={() => void save(response.trim())}
              >
                {busy
                  ? de
                    ? "Wird gespeichert…"
                    : "Saving…"
                  : de
                    ? "Antwort speichern"
                    : "Save answer"}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={busy}
                onClick={() => void save(null)}
              >
                {de ? "Diese Frage überspringen" : "Skip this question"}
              </button>
            </div>
            <button
              className="mt-7 text-sm underline"
              disabled={busy}
              type="button"
              onClick={() => void generate()}
            >
              {de
                ? "Mit bisherigen Antworten meine Richtung prüfen"
                : "Review a direction using my answers so far"}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-5xl tracking-tight">
              {de
                ? "Was davon passt wirklich zu dir?"
                : "Which direction feels like yours?"}
            </h1>
            <p className="my-6 text-lg text-muted">
              {de
                ? "Deine Antworten sind gespeichert. Als Nächstes prüfst du einen vorläufigen Nordstern und deine wichtigste Veränderung. Du kannst beides korrigieren, bevor dein Plan entsteht."
                : "Your answers are saved. Next, review a provisional north star and your most important change. You can correct both before we build your plan."}
            </p>
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={busy}
              onClick={() => void generate()}
            >
              {de ? "Meine Richtung prüfen" : "Review my direction"}
            </button>
          </>
        )}
        {error ? (
          <p role="alert" className="mt-5 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </main>
    </ResultShell>
  );
}
