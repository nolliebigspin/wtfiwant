"use client";

import {
  assessmentQuestions,
  chapters,
  isAnswerComplete,
} from "@wtfiwant/shared";
import { useEffect, useState } from "react";
import type { ReflectionClient } from "@/lib/api";

export function useReflectionJourney({
  sessionId,
  client,
}: {
  sessionId: string;
  client: ReflectionClient;
}) {
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

  const question = assessmentQuestions[index];
  const chapterIndex = question
    ? chapters.findIndex((chapter) => chapter.id === question.chapter)
    : -1;
  const value = question ? answers[question.id] : undefined;

  const complete = () => {
    window.location.assign(`/result/${sessionId}`);
  };

  const goBack = () => {
    if (index === 0) return;
    const previous = assessmentQuestions[index - 1];
    setIndex(index - 1);
    setError(null);
    void client.updateProgress(sessionId, previous.chapter, previous.id);
  };

  const continueJourney = async () => {
    if (!question || !isAnswerComplete(question, value)) {
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

  const changeAnswer = (next: unknown) => {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: next }));
    setError(null);
    setSaved(false);
  };

  return {
    chapterIndex,
    changeAnswer,
    complete,
    continueJourney,
    error,
    followUp,
    followUpResponse,
    goBack,
    index,
    loading,
    question,
    saved,
    saving,
    setFollowUpResponse,
    submitFollowUp,
    value,
  };
}
