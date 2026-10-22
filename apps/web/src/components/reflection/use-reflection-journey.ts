"use client";

import {
  chapters,
  freeJourney,
  isAnswerComplete,
  type Locale,
  missingFreeAnswers,
} from "@wtfiwant/shared";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useAnalyticsEvent } from "@/components/analytics/use-analytics-event";
import { trackAnalytics } from "@/lib/analytics";
import type { ReflectionClient } from "@/lib/api";

export function useReflectionJourney({
  sessionId,
  client,
}: {
  sessionId: string;
  client: ReflectionClient;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("Reflection");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const save = (id: string, value: unknown) => {
    const task = writes.current
      .catch(() => {})
      .then(() => client.saveAnswer(sessionId, id, value));
    writes.current = task;
    return task;
  };

  useEffect(() => {
    let active = true;
    client
      .getSession(sessionId)
      .then((view) => {
        if (!active) return;
        if (view.entitlements.includes("full_analysis")) {
          window.location.assign(`/${locale}/result/${sessionId}`);
          return;
        }
        const path = freeJourney(view.answers);
        setAnswers(view.answers);
        const restored = path.findIndex(
          (q) => q.id === view.session.currentQuestionId,
        );
        const firstMissing = missingFreeAnswers(view.answers)[0];
        const editing =
          new URLSearchParams(window.location.search).get("edit") === "1";
        if (!firstMissing && !editing) {
          window.location.assign(`/${locale}/result/${sessionId}`);
          return;
        }
        setIndex(
          editing
            ? 0
            : restored >= 0
              ? restored
              : Math.max(
                  0,
                  path.findIndex((q) => q.id === firstMissing),
                ),
        );
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
  }, [client, sessionId, locale, t]);

  const questions = freeJourney(answers);
  const question = questions[index];
  const value = question ? answers[question.id] : undefined;
  const chapterIndex = chapters.findIndex(
    (chapter) => chapter.id === question?.chapter,
  );
  useAnalyticsEvent("step_view", "reflection", locale, index, !loading);

  // Valid answers are saved while typing. Serial writes prevent a slow older
  // request from overwriting the latest value when Continue is pressed.
  useEffect(() => {
    if (loading || !question || !isAnswerComplete(question, value)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      const task = writes.current
        .catch(() => {})
        .then(() => client.saveAnswer(sessionId, question.id, value));
      writes.current = task;
      void task
        .then(() => {
          if (active) setSaved(true);
        })
        .catch(() => {
          if (active) setError(t("saveError"));
        });
    }, 800);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loading, question, value, client, sessionId, t]);

  const complete = () => {
    trackAnalytics("reflection_completed", "reflection", locale);
    window.location.assign(`/${locale}/result/${sessionId}`);
  };
  const continueJourney = async () => {
    if (!question || !isAnswerComplete(question, value)) {
      setError(t("required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await save(question.id, value);
      setSaved(true);
      trackAnalytics("answer_saved", "reflection", locale, index);
      const next = questions[index + 1];
      if (!next) return complete();
      await client.updateProgress(sessionId, next.chapter, next.id);
      setIndex(index + 1);
      setSaved(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("saveError"));
      trackAnalytics("journey_error", "reflection", locale, index);
    } finally {
      setSaving(false);
    }
  };
  const goBack = async () => {
    if (!index || saving) return;
    setSaving(true);
    try {
      if (question && isAnswerComplete(question, value))
        await save(question.id, value);
      const previous = questions[index - 1];
      await client.updateProgress(sessionId, previous.chapter, previous.id);
      setIndex(index - 1);
      setError(null);
      setSaved(false);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };
  const changeAnswer = (next: unknown) => {
    if (question) {
      setAnswers((current) => ({ ...current, [question.id]: next }));
      setError(null);
      setSaved(false);
    }
  };
  return {
    answers,
    chapterIndex,
    questions,
    changeAnswer,
    complete,
    continueJourney,
    error,
    goBack,
    index,
    loading,
    question,
    saved,
    saving,
    value,
  };
}
