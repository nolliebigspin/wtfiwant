"use client";

import { api, type ReflectionClient } from "@/lib/api";
import { ChapterProgress } from "./chapter-progress";
import { CurrentQuestion } from "./current-question";
import { FollowUpQuestion } from "./follow-up-question";
import { JourneyShell } from "./journey-shell";
import { useReflectionJourney } from "./use-reflection-journey";

type Props = { sessionId: string; client?: ReflectionClient };

export function ReflectionJourney({ sessionId, client = api }: Props) {
  const journey = useReflectionJourney({ sessionId, client });

  if (journey.loading) {
    return (
      <JourneyShell>
        <p className="pt-[30vh] text-center">Restoring your reflection…</p>
      </JourneyShell>
    );
  }

  if (journey.error && !journey.question) {
    return (
      <JourneyShell>
        <p className="mt-4 px-8 text-sm font-bold text-[#a22d19]">
          {journey.error}
        </p>
      </JourneyShell>
    );
  }

  if (!journey.question) return null;

  return (
    <JourneyShell>
      <ChapterProgress activeIndex={journey.chapterIndex} />
      <main className="mx-auto min-h-[calc(100vh-12rem)] w-[min(100%-2rem,56rem)] py-[clamp(4rem,8vw,7rem)]">
        {journey.followUp ? (
          <FollowUpQuestion
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
        Your reflections can be deeply personal. We only use them to generate
        your result.
      </p>
    </JourneyShell>
  );
}
