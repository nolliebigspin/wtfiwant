"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FormError } from "@/components/ui/form-error";
import { api } from "@/lib/api";
import { largePrimaryButtonClassName } from "@/lib/styles";

export function StartReflectionButton({ label }: { label?: string }) {
  const locale = useLocale();
  const t = useTranslations("Commitment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        className={largePrimaryButtonClassName}
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(false);
          try {
            const view = await api.createSession();
            localStorage.setItem("wtfiwant.sessionId", view.session.id);
            window.location.assign(`/${locale}/reflection/${view.session.id}`);
          } catch {
            setError(true);
            setLoading(false);
          }
        }}
      >
        {loading ? t("loading") : (label ?? t("start"))}
        <span className="text-xl" aria-hidden="true">
          ↗
        </span>
      </button>
      <FormError announce={false}>{error ? t("apiError") : null}</FormError>
    </div>
  );
}
