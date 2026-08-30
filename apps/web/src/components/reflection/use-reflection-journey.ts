"use client";

import {
  assessmentQuestions,
  chapters,
  isAnswerComplete,
} from "@wtfiwant/shared";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ReflectionClient } from "@/lib/api";

export function useReflectionJourney({
  sessionId,
  client,
}: {
  sessionId: string;
  client: ReflectionClient;
}) {
  const locale = useLocale();
  const t = useTranslations("Reflection");
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
        const restoredQuestion =
          assessmentQuestions[restoredIndex >= 0 ? restoredIndex : 0];
        const activePrompt = view.coachPrompts.find(
          (prompt) =>
            prompt.chapter === restoredQuestion.chapter && !prompt.resolvedAt,
        );
        if (activePrompt)
          setFollowUp({ id: activePrompt.id, question: activePrompt.question });
        localStorage.setItem("wtfiwant.sessionId", sessionId);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(t("restoreError"));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [client, sessionId, t]);

  const question = assessmentQuestions[index];
  const chapterIndex = question
    ? chapters.findIndex((chapter) => chapter.id === question.chapter)
    : -1;
  const value = question ? answers[question.id] : undefined;

  const complete = () => {
    window.location.assign(`/${locale}/result/${sessionId}`);
  };

  const advance = async () => {
    const next = assessmentQuestions[index + 1];
    if (!next) return complete();
    await client.updateProgress(sessionId, next.chapter, next.id);
    setFollowUp(null);
    setFollowUpResponse("");
    setIndex(index + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setError(t("required"));
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await client.saveAnswer(sessionId, question.id, value);
      setSaved(true);
      const next = assessmentQuestions[index + 1];
      const chapterComplete = !next || next.chapter !== question.chapter;
      if (chapterComplete) {
        try {
          const generated = await client.createCoachPrompt(
            sessionId,
            question.chapter,
            locale as "en" | "de",
          );
          if (generated.resolvedAt) await advance();
          else setFollowUp({ id: generated.id, question: generated.question });
        } catch {
          await advance();
        }
      } else await advance();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const submitFollowUp = async () => {
    setSaving(true);
    try {
      await client.resolveCoachPrompt(
        sessionId,
        followUp?.id ?? "",
        followUpResponse.trim() || null,
      );
      await advance();
    } catch {
      setError(t("followUpSaveError"));
      setSaving(false);
    }
  };

  const skipFollowUp = async () => {
    setSaving(true);
    try {
      await client.resolveCoachPrompt(sessionId, followUp?.id ?? "", null);
      await advance();
    } catch {
      setError(t("followUpSaveError"));
    } finally {
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
    skipFollowUp,
    value,
  };
}
