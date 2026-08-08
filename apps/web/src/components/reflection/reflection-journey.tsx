"use client";

import { assessmentQuestions, chapters, tradeoffPairs } from "@wtfiwant/shared";
import { useEffect, useState } from "react";
import { api, type ReflectionClient } from "@/lib/api";
import { answerToFollowUpText, isAnswerComplete } from "@/lib/journey";
import { QuestionInput } from "./question-inputs";

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
    const valueToSave =
      question.type === "tradeoffs" && value === undefined
        ? { choices: tradeoffPairs.map(() => 0) }
        : value;
    if (!isAnswerComplete(question, valueToSave)) {
      setError("Give this one an honest answer before moving on.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await client.saveAnswer(sessionId, question.id, valueToSave);
      setSaved(true);
      if (index < assessmentQuestions.length - 1) {
        const next = assessmentQuestions[index + 1];
        await client.updateProgress(sessionId, next.chapter, next.id);
        setIndex(index + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        try {
          const generated = await client.createFollowUp(
            sessionId,
            question.id,
            answerToFollowUpText(valueToSave),
          );
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
          <section className="question-enter">
            <p className="eyebrow">ONE LAST CLARIFICATION</p>
            <h1 className="question-title">{followUp.question}</h1>
            <p className="question-description">
              This is optional. A useful distinction is enough.
            </p>
            <textarea
              className="answer-textarea"
              value={followUpResponse}
              onChange={(event) => setFollowUpResponse(event.target.value)}
            />
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="journey-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={complete}
              >
                Skip
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={submitFollowUp}
              >
                {saving ? "Saving…" : "See my Compass"}
              </button>
            </div>
          </section>
        ) : (
          <section className="question-enter" key={question.id}>
            <p className="eyebrow">
              {chapters[chapterIndex].label} · {index + 1} OF{" "}
              {assessmentQuestions.length}
            </p>
            <p className="chapter-note">{chapters[chapterIndex].eyebrow}</p>
            <h1 className="question-title">{question.prompt}</h1>
            {question.description ? (
              <p className="question-description">{question.description}</p>
            ) : null}
            <QuestionInput
              question={question}
              value={value}
              onChange={(next) => {
                setAnswers((current) => ({ ...current, [question.id]: next }));
                setError(null);
                setSaved(false);
              }}
            />
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="journey-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={index === 0 || saving}
                onClick={goBack}
              >
                Back
              </button>
              <div className="flex items-center gap-4">
                <span className="saved-state" aria-live="polite">
                  {saved ? "Saved" : ""}
                </span>
                <button
                  className="primary-button"
                  type="button"
                  disabled={saving}
                  onClick={continueJourney}
                >
                  {saving
                    ? "Saving…"
                    : index === assessmentQuestions.length - 1
                      ? "Make sense of this"
                      : "Continue"}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      <p className="privacy-footer">
        Your reflections can be deeply personal. We only use them to generate
        your result.
      </p>
    </JourneyShell>
  );
}

function ChapterProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <nav className="chapter-progress" aria-label="Reflection chapters">
      {chapters.map((chapter, index) => (
        <span
          key={chapter.id}
          className={
            index === activeIndex
              ? "active"
              : index < activeIndex
                ? "complete"
                : ""
          }
        >
          {index < activeIndex ? "✓" : chapter.label}
        </span>
      ))}
    </nav>
  );
}

function JourneyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="journey-shell">
      <header className="journey-header">
        <a href="/" className="wordmark">
          wtfiwant<span>.</span>
        </a>
      </header>
      {children}
    </div>
  );
}
