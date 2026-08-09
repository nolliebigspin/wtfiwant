"use client";

import { seedPersonas } from "@wtfiwant/shared";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api";

export function SeedButtons() {
  const locale = useLocale();
  const t = useTranslations("Commitment");
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="mt-8 border-t border-dashed border-ink/30 pt-4">
      <p className="text-[0.7rem] text-muted uppercase">{t("dev")}</p>
      <div className="flex flex-wrap gap-2">
        {seedPersonas.map(({ id, label }) => (
          <button
            className="motion-button cursor-pointer rounded-full border border-ink/20 bg-transparent px-4 py-2.5 hover:border-ink hover:bg-white/35 disabled:cursor-wait disabled:opacity-50"
            type="button"
            key={id}
            disabled={Boolean(loading)}
            onClick={async () => {
              setLoading(id);
              const view = await api.seed(id);
              window.location.assign(`/${locale}/result/${view?.session.id}`);
            }}
          >
            {loading === id ? t("seeding") : label}
          </button>
        ))}
      </div>
    </div>
  );
}
