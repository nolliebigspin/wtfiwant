"use client";

import type { Locale } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { api, type ReflectionClient } from "@/lib/api";
import { ChapterProgress } from "./chapter-progress";
import { CurrentQuestion } from "./current-question";
import { FollowUpQuestion } from "./follow-up-question";
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
      <ChapterProgress activeIndex={journey.chapterIndex} locale={locale} />
      <main className="mx-auto min-h-[calc(100vh-12rem)] w-[min(100%-2rem,56rem)] py-[clamp(4rem,8vw,7rem)]">
        {journey.followUp ? (
          <FollowUpQuestion
            locale={locale}
            question={journey.followUp.question}
            response={journey.followUpResponse}
            error={journey.error}
            saving={journey.saving}
            onResponseChange={journey.setFollowUpResponse}
            onSkip={journey.complete}
            onSubmit={journey.submitFollowUp}
          />
        ) : (
          <CurrentQuestion
            question={journey.question}
            locale={locale}
            chapterIndex={journey.chapterIndex}
            questionIndex={journey.index}
            value={journey.value}
            error={journey.error}
            saving={journey.saving}
            saved={journey.saved}
            onAnswerChange={journey.changeAnswer}
            onBack={journey.goBack}
            onContinue={journey.continueJourney}
          />
        )}
      </main>
      <p className="m-0 p-6 text-center text-[0.67rem] text-muted">
        {t("Common.privacy")}
      </p>
    </JourneyShell>
  );
}
