"use client";

import { useState } from "react";
import { FormError } from "@/components/ui/form-error";
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
      <FormError>
        {error
          ? "Couldn't reach the API. Check it is running, then try again."
          : null}
      </FormError>
    </div>
  );
}
