import { ResultShell } from "./result-shell";

export function ResultError({ message }: { message: string }) {
  return (
    <ResultShell>
      <main className="result-loading">
        <h1>Something got in the way.</h1>
        <p>{message}</p>
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
}

export function SafetyResult({ message }: { message: string }) {
  return (
    <ResultShell>
      <main className="safety-state">
        <p className="eyebrow">PAUSE HERE</p>
        <h1>Your safety matters more than this result.</h1>
        <p>{message}</p>
      </main>
    </ResultShell>
  );
}

export function ResultLoading() {
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
}
