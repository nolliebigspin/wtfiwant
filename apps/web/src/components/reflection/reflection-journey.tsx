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
        <p className="loading-copy">Restoring your reflection…</p>
      </JourneyShell>
    );
  }

  if (journey.error && !journey.question) {
    return (
      <JourneyShell>
        <p className="error-copy">{journey.error}</p>
      </JourneyShell>
    );
  }

  if (!journey.question) return null;

  return (
    <JourneyShell>
      <ChapterProgress activeIndex={journey.chapterIndex} />
      <main className="journey-main">
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
      <p className="privacy-footer">
        Your reflections can be deeply personal. We only use them to generate
        your result.
      </p>
    </JourneyShell>
  );
}
