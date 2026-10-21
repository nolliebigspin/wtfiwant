"use client";
import {
  type AnalyticsEvent,
  analyticsConfigSchema,
  isLocalAnalyticsHost,
  type Locale,
} from "@wtfiwant/shared";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type AnalyticsConsent,
  analyticsConsent,
  chooseAnalytics,
  configureAnalytics,
  privacySignal,
  trackAnalytics,
} from "@/lib/analytics";

function pageFromPath(path: string): AnalyticsEvent["page"] | null {
  const parts = path.split("/").filter(Boolean).slice(1);
  if (parts.length === 0) return "landing";
  if (["reflection", "result"].includes(parts[0]) && parts.length === 2)
    return parts[0] as "reflection" | "result";
  if (
    parts.length === 1 &&
    ["commitment", "terms", "refunds", "withdraw", "privacy"].includes(parts[0])
  )
    return parts[0] as AnalyticsEvent["page"];
  return null;
}
export function AnalyticsControls({ locale }: { locale: Locale }) {
  const [enabled, setEnabled] = useState(false);
  const path = usePathname();
  const [choice, setChoice] = useState<AnalyticsConsent>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState(false);
  const de = locale === "de";
  useEffect(() => {
    if (isLocalAnalyticsHost(window.location.hostname)) {
      configureAnalytics(false);
      setReady(true);
      return;
    }
    let active = true;
    void fetch("/api/analytics/config", {
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    })
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((body) => {
        if (!active) return;
        const config = analyticsConfigSchema.parse(body);
        configureAnalytics(config.enabled);
        setEnabled(config.enabled);
        setChoice(analyticsConsent());
        setBlocked(privacySignal());
        setReady(true);
      })
      .catch(() => {
        if (active) {
          configureAnalytics(false);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const page = pageFromPath(path);
    if (ready && choice === "accepted" && page)
      trackAnalytics("page_view", page, locale);
  }, [path, locale, choice, ready]);
  if (!enabled || !ready || path.includes("/admin/")) return null;
  const save = async (value: Exclude<AnalyticsConsent, null>) => {
    setError(false);
    try {
      await chooseAnalytics(value);
      setChoice(value);
      setOpen(false);
    } catch {
      setChoice("declined");
      setError(true);
    }
  };
  return (
    <>
      {(open || (choice === null && !blocked) || error) && (
        <aside
          aria-label={de ? "Analytics-Einstellungen" : "Analytics preferences"}
          className="fixed inset-x-3 bottom-14 z-50 mx-auto max-w-xl rounded-lg border border-ink/20 bg-paper p-5 shadow-xl"
        >
          <h2 className="text-base font-bold">
            {de
              ? "Hilfst du uns, die Reflexion zu verbessern?"
              : "Help us improve the reflection?"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {de
              ? "Mit deiner Erlaubnis messen wir Seitenaufrufe, Fortschritt und Kampagnen auf unserem Server. Keine Antworten, E-Mail-Adressen oder privaten Report-Links. Keine Weitergabe an Meta. Du kannst jederzeit widerrufen."
              : "With your permission, we measure page views, progress and campaigns on our server. No answers, email addresses or private report links. No sharing with Meta. You can withdraw anytime."}
          </p>
          <a
            className="mt-2 inline-block text-sm underline"
            href={`/${locale}/privacy`}
          >
            {de ? "Datenschutz und Details" : "Privacy and details"}
          </a>
          {blocked && (
            <p className="mt-2 text-sm">
              {de
                ? "Das Datenschutzsignal deines Browsers verhindert die Messung."
                : "Your browser's privacy signal prevents measurement."}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm">
              {de
                ? "Die Messung ist gestoppt. Das Entfernen noch wartender Ereignisse ist fehlgeschlagen. Bitte erneut ablehnen, um es nochmals zu versuchen."
                : "Measurement has stopped. Removing queued events failed. Please decline again to retry."}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded border border-ink px-4 py-2 text-sm font-bold"
              onClick={() => void save("declined")}
            >
              {de ? "Ablehnen" : "Decline"}
            </button>
            <button
              disabled={blocked}
              type="button"
              className="rounded border border-ink px-4 py-2 text-sm font-bold disabled:opacity-40"
              onClick={() => void save("accepted")}
            >
              {de ? "Erlauben" : "Allow"}
            </button>
          </div>
        </aside>
      )}
      <button
        type="button"
        className="fixed bottom-3 left-3 z-40 rounded-full border border-ink/20 bg-paper px-3 py-2 text-xs shadow-sm"
        onClick={() => setOpen(true)}
      >
        {de ? "Datenschutz-Einstellungen" : "Privacy preferences"}
      </button>
    </>
  );
}
