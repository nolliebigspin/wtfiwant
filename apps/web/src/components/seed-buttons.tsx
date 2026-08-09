"use client";

import { seedPersonas } from "@wtfiwant/shared";
import { useState } from "react";
import { api } from "@/lib/api";

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
