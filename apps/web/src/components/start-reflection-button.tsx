"use client";

import { seedPersonas } from "@wtfiwant/shared";
import { useState } from "react";
import { api } from "@/lib/api";

export function StartReflectionButton({
  label = "I have the time",
}: {
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        className="primary-button large"
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(false);
          try {
            const view = await api.createSession();
            localStorage.setItem("wtfiwant.sessionId", view.session.id);
            window.location.assign(`/reflection/${view.session.id}`);
          } catch {
            setError(true);
            setLoading(false);
          }
        }}
      >
        {loading ? "Making space…" : label}
        <span aria-hidden="true">↗</span>
      </button>
      {error ? (
        <p className="form-error">
          Couldn't reach the API. Check it is running, then try again.
        </p>
      ) : null}
    </div>
  );
}

export function SeedButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  return (
    <div className="seed-tools">
      <p>Development shortcuts</p>
      <div>
        {seedPersonas.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            disabled={Boolean(loading)}
            onClick={async () => {
              setLoading(id);
              const view = await api.seed(id);
              window.location.assign(`/result/${view?.session.id}`);
            }}
          >
            {loading === id ? "Seeding…" : label}
          </button>
        ))}
      </div>
    </div>
  );
}
