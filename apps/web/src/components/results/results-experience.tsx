"use client";

import type {
  ActionPlanInput,
  Analysis,
  AnalysisResponse,
  SessionView,
} from "@wtfiwant/shared";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface ResultsClient {
  getSession(id: string): Promise<SessionView>;
  analyze(id: string): Promise<AnalysisResponse>;
  saveActionPlan(id: string, input: ActionPlanInput): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

type Props = { sessionId: string; client?: ResultsClient };

export function ResultsExperience({ sessionId, client = api }: Props) {
  const [view, setView] = useState<SessionView | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    client
      .getSession(sessionId)
      .then(async (restored) => {
        if (!active) return;
        setView(restored);
        if (restored.analysis) {
          setAnalysis(restored.analysis.result);
          return;
        }
        const generated = await client.analyze(sessionId);
        if (!active) return;
        if (generated.status === "safety_paused")
          setSafetyMessage(generated.message);
        else setAnalysis(generated.analysis.result);
      })
      .catch(
        () =>
          active &&
          setError(
            "We couldn't generate your Compass. Your answers are still saved; try again.",
          ),
      );
    return () => {
      active = false;
    };
  }, [client, sessionId]);

  if (error)
    return (
      <ResultShell>
        <main className="result-loading">
          <h1>Something got in the way.</h1>
          <p>{error}</p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
        </main>
      </ResultShell>
    );
  if (safetyMessage)
    return (
      <ResultShell>
        <main className="safety-state">
          <p className="eyebrow">PAUSE HERE</p>
          <h1>Your safety matters more than this result.</h1>
          <p>{safetyMessage}</p>
        </main>
      </ResultShell>
    );
  if (!view || !analysis)
    return (
      <ResultShell>
        <main className="result-loading">
          <div className="analysis-mark" aria-hidden="true">
            ✦
          </div>
          <h1>Reading for patterns.</h1>
          <p>Separating evidence from interpretation…</p>
        </main>
      </ResultShell>
    );

  const evidenceAnswers = {
    ...view.answers,
    ...Object.fromEntries(
      view.followUps.flatMap((followUp) =>
        followUp.userResponse
          ? [
              [
                `followup:${followUp.questionId}:${followUp.id}`,
                {
                  question: followUp.generatedQuestion,
                  answer: followUp.userResponse,
                },
              ],
            ]
          : [],
      ),
    ),
  };

  return (
    <ResultShell>
      <main>
        <section className="result-hero">
          <p className="eyebrow">YOUR ANSWERS, READ BACK CAREFULLY</p>
          <h1>Your Compass</h1>
          <p className="result-caveat">
            This isn't who you are. It's our best interpretation of what you
            told us. Keep what feels true. Challenge what doesn't.
          </p>
          <p className="result-summary">{analysis.summary}</p>
        </section>

        <section
          className="result-section compass-grid"
          aria-labelledby="drivers-title"
        >
          <div className="section-heading">
            <p className="eyebrow">SIGNALS, NOT SCORES</p>
            <h2 id="drivers-title">What seems to matter</h2>
          </div>
          <div className="driver-grid">
            {analysis.coreDrivers.map((driver, index) => (
              <article className="driver-card" key={driver.id}>
                <span className="card-number">0{index + 1}</span>
                <h3>{driver.name}</h3>
                <p>{driver.explanation}</p>
                <EvidenceDrawer
                  ids={driver.evidenceQuestionIds}
                  answers={evidenceAnswers}
                />
              </article>
            ))}
          </div>
        </section>

        {analysis.tensions.length > 0 ? (
          <section
            className="tensions-section"
            aria-labelledby="tensions-title"
          >
            <div className="section-heading">
              <p className="eyebrow light">THE USEFUL FRICTION</p>
              <h2 id="tensions-title">Your Tensions</h2>
              <p>
                Not problems to eliminate. Conditions your life may need to hold
                at the same time.
              </p>
            </div>
            <div className="space-y-5">
              {analysis.tensions.map((tension) => (
                <article className="tension-card" key={tension.id}>
                  <h3>
                    <span>{tension.sideA}</span>
                    <b>↔</b>
                    <span>{tension.sideB}</span>
                  </h3>
                  <p>{tension.explanation}</p>
                  <EvidenceDrawer
                    ids={tension.evidenceQuestionIds}
                    answers={evidenceAnswers}
                    dark
                  />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="result-section anti-life"
          aria-labelledby="anti-title"
        >
          <div className="section-heading">
            <p className="eyebrow">A CLEAR NO</p>
            <h2 id="anti-title">Your Anti-Life</h2>
          </div>
          <blockquote>{analysis.antiLife.summary}</blockquote>
          <div className="theme-list">
            {analysis.antiLife.themes.map((theme) => (
              <span key={theme}>{theme}</span>
            ))}
          </div>
          <EvidenceDrawer
            ids={analysis.antiLife.evidenceQuestionIds}
            answers={evidenceAnswers}
          />
        </section>

        {analysis.externalInfluences.length > 0 ? (
          <section className="result-section">
            <div className="section-heading">
              <p className="eyebrow">THE NOISE</p>
              <h2>What may not be entirely yours</h2>
            </div>
            {analysis.externalInfluences.map((influence) => (
              <article className="influence-card" key={influence.observation}>
                <p>{influence.observation}</p>
                <EvidenceDrawer
                  ids={influence.evidenceQuestionIds}
                  answers={evidenceAnswers}
                />
              </article>
            ))}
          </section>
        ) : null}

        <section
          className="result-section directions"
          aria-labelledby="directions-title"
        >
          <div className="section-heading">
            <p className="eyebrow">HYPOTHESES TO TEST</p>
            <h2 id="directions-title">Directions worth exploring</h2>
            <p>
              None of these is “your perfect life.” They are places to collect
              better evidence.
            </p>
          </div>
          <div className="direction-grid">
            {analysis.possibleDirections.map((direction, index) => (
              <article className="direction-card" key={direction.title}>
                <span className="direction-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{direction.title}</h3>
                <p>{direction.explanation}</p>
                <small>WHY IT MAY FIT</small>
                <p>{direction.whyItFits}</p>
                <EvidenceDrawer
                  ids={direction.evidenceQuestionIds}
                  answers={evidenceAnswers}
                />
              </article>
            ))}
          </div>
        </section>

        {analysis.goals.length > 0 ? (
          <section className="result-section" aria-labelledby="goals-title">
            <div className="section-heading">
              <p className="eyebrow">BENEATH THE STATED GOAL</p>
              <h2 id="goals-title">
                What you may be asking the goal to provide
              </h2>
            </div>
            <div className="direction-grid">
              {analysis.goals.map((goal) => (
                <article className="direction-card" key={goal.originalGoal}>
                  <span className="direction-index">YOU SAID</span>
                  <h3>{goal.originalGoal}</h3>
                  <small>POSSIBLE UNDERLYING NEED</small>
                  <p>{goal.possibleUnderlyingNeed}</p>
                  <p>{goal.interpretation}</p>
                  <EvidenceDrawer
                    ids={goal.evidenceQuestionIds}
                    answers={evidenceAnswers}
                  />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="start-transition">
          <p className="eyebrow light">STOP → UNDERSTAND → START</p>
          <h2>
            You've thought enough.
            <br />
            <em>Now do something.</em>
          </h2>
          <p>
            Understanding what you want is useful. But you won't think your way
            into a different life.
          </p>
          <div className="start-line">
            <span>Whatever it is.</span>
            <strong>Start.</strong>
          </div>
        </section>

        <ActionPlanBuilder
          sessionId={sessionId}
          steps={analysis.firstSteps}
          answers={evidenceAnswers}
          savedPlan={view.actionPlan}
          onSave={(input) => client.saveActionPlan(sessionId, input)}
        />

        <section className="privacy-actions">
          <p>
            Your reflections can be deeply personal. We only use them to
            generate your result.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (
                !window.confirm(
                  "Delete this reflection and every answer? This cannot be undone.",
                )
              )
                return;
              await client.deleteSession(sessionId);
              localStorage.removeItem("wtfiwant.sessionId");
              window.location.assign("/");
            }}
          >
            Delete my reflection
          </button>
        </section>
      </main>
    </ResultShell>
  );
}

function EvidenceDrawer({
  ids,
  answers,
  dark = false,
}: {
  ids: string[];
  answers: Record<string, unknown>;
  dark?: boolean;
}) {
  return (
    <details className={`evidence-drawer ${dark ? "dark" : ""}`}>
      <summary>Why do you think this?</summary>
      <div>
        <p className="evidence-label">Evidence from your answers</p>
        {ids.map((id) => (
          <figure key={id}>
            <blockquote>{formatAnswer(answers[id])}</blockquote>
            <figcaption>{id}</figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}

function formatAnswer(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  if (answer === undefined) return "No saved answer.";
  return JSON.stringify(answer, null, 2)
    .replace(/[{}[\]"]/g, "")
    .replace(/,/g, " · ");
}

const obstacles = [
  "I'm tired after work",
  "Social media",
  "I overthink things",
  "I don't know where to start",
  "I'm afraid I'll fail",
  "I always postpone it",
  "Other",
];

function ActionPlanBuilder({
  sessionId,
  steps,
  savedPlan,
  answers,
  onSave,
}: {
  sessionId: string;
  steps: Analysis["firstSteps"];
  answers: Record<string, unknown>;
  savedPlan: SessionView["actionPlan"];
  onSave: (input: ActionPlanInput) => Promise<void>;
}) {
  const initialIndex = Math.max(
    0,
    steps.findIndex((step) => step.direction === savedPlan?.direction),
  );
  const [selected, setSelected] = useState(initialIndex);
  const step = steps[selected] ?? steps[0];
  const [form, setForm] = useState<ActionPlanInput>(
    () =>
      savedPlan ?? {
        direction: step.direction,
        experiment: step.experiment,
        immediateAction: step.immediateAction,
        obstacle: "",
        ifCondition: "",
        thenAction: "",
      },
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (key: keyof ActionPlanInput, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const chooseStep = (index: number) => {
    setSelected(index);
    setForm((current) => ({
      ...current,
      direction: steps[index].direction,
      experiment: steps[index].experiment,
      immediateAction: steps[index].immediateAction,
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim())) {
      setError("Make each part concrete before you start.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setDone(true);
    } catch {
      setError("That didn't save. Nothing was lost — try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="action-builder" id={`start-${sessionId}`}>
      <div className="section-heading">
        <p className="eyebrow">DIRECTION → EXPERIMENT → NOW</p>
        <h2>Make it real enough to begin.</h2>
        <p>
          You do not need to solve your life. Pick one direction and run a
          small, reversible experiment.
        </p>
      </div>
      <div className="step-choices">
        {steps.map((candidate, index) => (
          <button
            className={selected === index ? "selected" : ""}
            type="button"
            key={candidate.direction}
            onClick={() => chooseStep(index)}
          >
            <span>DIRECTION {index + 1}</span>
            <strong>{candidate.direction}</strong>
          </button>
        ))}
      </div>
      <EvidenceDrawer ids={step.evidenceQuestionIds} answers={answers} />
      <form onSubmit={save} className="plan-form">
        <PlanField
          number="01"
          label="Direction"
          hint="A broad direction to explore"
        >
          <input
            aria-label="Direction"
            value={form.direction}
            onChange={(event) => update("direction", event.target.value)}
          />
        </PlanField>
        <PlanField
          number="02"
          label="Experiment"
          hint="A reversible real-world test"
        >
          <textarea
            aria-label="Experiment"
            value={form.experiment}
            onChange={(event) => update("experiment", event.target.value)}
          />
        </PlanField>
        <PlanField
          number="03"
          label="Now"
          hint="Something small enough for the next 24 hours"
        >
          <textarea
            aria-label="Now"
            value={form.immediateAction}
            onChange={(event) => update("immediateAction", event.target.value)}
          />
        </PlanField>
        <div className="intention-card">
          <p className="eyebrow">
            MAKE A PLAN FOR THE MOMENT MOTIVATION DISAPPEARS
          </p>
          <label>
            <span>What's most likely to stop you?</span>
            <select
              aria-label="What's most likely to stop you?"
              value={form.obstacle}
              onChange={(event) => update("obstacle", event.target.value)}
            >
              <option value="">Choose the honest obstacle</option>
              {obstacles.map((obstacle) => (
                <option key={obstacle}>{obstacle}</option>
              ))}
            </select>
          </label>
          <div className="if-then">
            <label>
              <span>If</span>
              <textarea
                aria-label="If"
                value={form.ifCondition}
                onChange={(event) => update("ifCondition", event.target.value)}
                placeholder="I get home and automatically open Instagram…"
              />
            </label>
            <div className="then-arrow">→</div>
            <label>
              <span>Then</span>
              <textarea
                aria-label="Then"
                value={form.thenAction}
                onChange={(event) => update("thenAction", event.target.value)}
                placeholder="I'll first spend ten minutes on the next step…"
              />
            </label>
          </div>
        </div>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="start-submit">
          <p>Motivation may show up after you begin. Make beginning smaller.</p>
          <button className="start-button" disabled={saving} type="submit">
            {saving ? "Starting…" : "Start now"}
          </button>
          {done ? (
            <strong className="started-message">
              Started. Not solved — started.
            </strong>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function PlanField({
  number,
  label,
  hint,
  children,
}: {
  number: string;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="plan-field">
      <span className="plan-number">{number}</span>
      <span className="plan-label">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      {children}
    </div>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="result-shell">
      <header className="result-header">
        <a href="/" className="wordmark">
          wtfiwant<span>.</span>
        </a>
        <span>YOUR REFLECTION</span>
      </header>
      {children}
    </div>
  );
}
