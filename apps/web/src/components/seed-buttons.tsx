"use client";

import { seedPersonas } from "@wtfiwant/shared";
import { useState } from "react";
import { api } from "@/lib/api";

export function SeedButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="mt-8 border-t border-dashed border-ink/30 pt-4">
      <p className="text-[0.7rem] text-muted uppercase">
        Development shortcuts
      </p>
      <div className="flex flex-wrap gap-2">
        {seedPersonas.map(({ id, label }) => (
          <button
            className="cursor-pointer rounded-full border border-ink/20 bg-transparent px-4 py-2.5 transition-colors hover:border-ink disabled:cursor-wait disabled:opacity-50"
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
