"use client";

import { type SeedPersona, seedPersonas } from "@wtfiwant/shared";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { fieldControlClassName, primaryButtonClassName } from "@/lib/styles";

type PaymentTestClient = {
  seed(persona: string): Promise<{
    session: { id: string };
    checkoutAvailable: boolean;
  }>;
  createCheckout: typeof api.createCheckout;
};

export function PaymentTestForm({
  client = api,
  navigate = (url: string) => window.location.assign(url),
}: {
  client?: PaymentTestClient;
  navigate?: (url: string) => void;
}) {
  const locale = useLocale() === "de" ? "de" : "en";
  const t = useTranslations("PaymentTest");
  const [persona, setPersona] = useState<SeedPersona>("burned_out");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  // Retain the session on Checkout failure so retries reuse the same purchase.
  const session = useRef<{ persona: SeedPersona; id: string } | null>(null);

  return (
    <form
      className="mt-8 space-y-4 rounded-2xl border border-dashed border-ink/30 p-5"
      aria-labelledby="payment-test-title"
      aria-busy={loading}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        setLoading(true);
        setError(null);
        try {
          if (session.current?.persona !== persona) {
            const view = await client.seed(persona);
            if (!view.checkoutAvailable) {
              setError(t("unavailable"));
              return;
            }
            session.current = { persona, id: view.session.id };
          }
          const checkout = await client.createCheckout(
            session.current.id,
            locale,
          );
          navigate(
            checkout.status === "paid"
              ? `/${locale}/result/${session.current.id}`
              : checkout.url,
          );
        } catch {
          setError(t("error"));
        } finally {
          pending.current = false;
          setLoading(false);
        }
      }}
    >
      <h2 id="payment-test-title" className="m-0 text-xl font-bold">
        {t("title")}
      </h2>
      <p className="text-sm text-muted">{t("description")}</p>
      <label className="block space-y-2">
        <span className="text-sm font-bold">{t("persona")}</span>
        <select
          className={fieldControlClassName}
          value={persona}
          disabled={loading}
          onChange={(event) => {
            const selected = seedPersonas.find(
              ({ id }) => id === event.target.value,
            );
            if (selected) setPersona(selected.id);
            setError(null);
          }}
        >
          {seedPersonas.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className={primaryButtonClassName}
        disabled={loading}
      >
        {loading ? t("loading") : t("submit")}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
