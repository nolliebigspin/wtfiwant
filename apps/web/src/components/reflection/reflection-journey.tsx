"use client";

import type { Locale } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { api, type ReflectionClient } from "@/lib/api";

import { CurrentQuestion } from "./current-question";

import { JourneyShell } from "./journey-shell";
import { useReflectionJourney } from "./use-reflection-journey";

type Props = {
  sessionId: string;
  locale?: Locale;
  client?: ReflectionClient;
};

export function ReflectionJourney({
  sessionId,
  locale = "en",
  client = api,
}: Props) {
  const t = useTranslations();
  const journey = useReflectionJourney({ sessionId, client });

  if (journey.loading) {
    return (
      <JourneyShell>
        <p className="motion-page-enter pt-[30vh] text-center">
          <span
            className="mr-3 inline-block animate-[pulse-mark_1.3s_infinite_alternate] text-accent"
            aria-hidden="true"
          >
            ✦
          </span>
          {t("Reflection.restoring")}
        </p>
      </JourneyShell>
    );
  }

  if (journey.error && !journey.question) {
    return (
      <JourneyShell>
        <p className="motion-feedback mt-4 px-8 text-sm font-bold text-[#a22d19]">
          {journey.error}
        </p>
      </JourneyShell>
    );
  }

  if (!journey.question) return null;

  return (
    <JourneyShell>
      <nav
        aria-label={locale === "de" ? "Dein Fortschritt" : "Your progress"}
        className="mx-auto max-w-4xl px-6 pt-6"
      >
        <div className="mb-3 flex justify-between text-xs font-bold text-muted">
          <span>
            {locale === "de"
              ? "01 · Kostenlose Reflexion"
              : "01 · Free reflection"}
          </span>
          <span>
            {locale === "de"
              ? "02 · Dein Zwischenstand"
              : "02 · Your checkpoint"}
          </span>
          <span>
            {locale === "de"
              ? "03 · KI-Kompass (optional)"
              : "03 · AI Compass (optional)"}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={
            locale === "de" ? "Beantwortete Fragen" : "Questions answered"
          }
          aria-valuemin={0}
          aria-valuemax={journey.questions.length}
          aria-valuenow={journey.index}
          className="h-1 overflow-hidden rounded-full bg-ink/10"
        >
          <div
            className="h-full bg-accent transition-all"
            style={{
              width: `${(journey.index / journey.questions.length) * 100}%`,
            }}
          />
        </div>
      </nav>
      <main className="mx-auto min-h-[calc(100vh-12rem)] w-[min(100%-2rem,56rem)] py-[clamp(4rem,8vw,7rem)]">
        <CurrentQuestion
          question={journey.question}
          locale={locale}
          chapterIndex={journey.chapterIndex}
          questionIndex={journey.index}
          questionCount={journey.questions.length}
          answers={journey.answers}
          value={journey.value}
          error={journey.error}
          saving={journey.saving}
          saved={journey.saved}
          onAnswerChange={journey.changeAnswer}
          onBack={journey.goBack}
          onContinue={journey.continueJourney}
        />
      </main>
      <p className="m-0 p-6 text-center text-[0.67rem] text-muted">
        {t("Common.privacy")}
      </p>
    </JourneyShell>
  );
}
