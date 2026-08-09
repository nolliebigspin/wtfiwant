"use client";

import {
  assessmentQuestions,
  chapters,
  isAnswerComplete,
} from "@wtfiwant/shared";
import { useEffect, useState } from "react";
import { api, type ReflectionClient } from "@/lib/api";
import { ChapterProgress } from "./chapter-progress";
import { CurrentQuestion } from "./current-question";
import { FollowUpQuestion } from "./follow-up-question";
import { JourneyShell } from "./journey-shell";

type Props = { sessionId: string; client?: ReflectionClient };

export function ReflectionJourney({ sessionId, client = api }: Props) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState("");

  useEffect(() => {
    let active = true;
    client
      .getSession(sessionId)
      .then((view) => {
        if (!active) return;
        setAnswers(view.answers);
        const restoredIndex = assessmentQuestions.findIndex(
          (question) => question.id === view.session.currentQuestionId,
        );
        setIndex(restoredIndex >= 0 ? restoredIndex : 0);
        localStorage.setItem("wtfiwant.sessionId", sessionId);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(
            "We couldn't restore this reflection. Check that the API is running and try again.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [client, sessionId]);

  if (loading)
    return (
      <JourneyShell>
        <p className="loading-copy">Restoring your reflection…</p>
      </JourneyShell>
    );
  if (error && !assessmentQuestions[index])
    return (
      <JourneyShell>
        <p className="error-copy">{error}</p>
      </JourneyShell>
    );

  const question = assessmentQuestions[index];
  const chapterIndex = chapters.findIndex(
    (chapter) => chapter.id === question.chapter,
  );
  const value = answers[question.id];

  const goBack = () => {
    if (index === 0) return;
    const previous = assessmentQuestions[index - 1];
    setIndex(index - 1);
    setError(null);
    void client.updateProgress(sessionId, previous.chapter, previous.id);
  };

  const complete = () => {
    window.location.assign(`/result/${sessionId}`);
  };

  const continueJourney = async () => {
    if (!isAnswerComplete(question, value)) {
      setError("Give this one an honest answer before moving on.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await client.saveAnswer(sessionId, question.id, value);
      setSaved(true);
      if (index < assessmentQuestions.length - 1) {
        const next = assessmentQuestions[index + 1];
        await client.updateProgress(sessionId, next.chapter, next.id);
        setIndex(index + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        try {
          const generated = await client.createFollowUp(sessionId, question.id);
          setFollowUp({
            id: generated.id,
            question: generated.generatedQuestion,
          });
        } catch {
          complete();
        }
      }
    } catch {
      setError("That didn't save. Your answer is still here — try again.");
    } finally {
      setSaving(false);
    }
  };

  const submitFollowUp = async () => {
    if (!followUpResponse.trim()) return complete();
    setSaving(true);
    try {
      await client.saveFollowUpResponse(
        sessionId,
        followUp?.id ?? "",
        followUpResponse,
      );
      complete();
    } catch {
      setError("That didn't save. Try once more, or skip this question.");
      setSaving(false);
    }
  };

  return (
    <JourneyShell>
      <ChapterProgress activeIndex={chapterIndex} />
      <main className="journey-main">
        {followUp ? (
          <FollowUpQuestion
            question={followUp.question}
            response={followUpResponse}
            error={error}
            saving={saving}
            onResponseChange={setFollowUpResponse}
            onSkip={complete}
            onSubmit={submitFollowUp}
          />
        ) : (
          <CurrentQuestion
            question={question}
            chapterIndex={chapterIndex}
            questionIndex={index}
            value={value}
            error={error}
            saving={saving}
            saved={saved}
            onAnswerChange={(next) => {
              setAnswers((current) => ({ ...current, [question.id]: next }));
              setError(null);
              setSaved(false);
            }}
            onBack={goBack}
            onContinue={continueJourney}
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
