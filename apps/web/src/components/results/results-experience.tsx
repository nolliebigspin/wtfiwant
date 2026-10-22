"use client";

import type {
  Analysis,
  Checkpoint,
  Locale,
  PaidJourney,
  SessionView,
} from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAnalyticsEvent } from "@/components/analytics/use-analytics-event";
import { trackAnalytics } from "@/lib/analytics";
import { api } from "@/lib/api";
import { ActionPlanBuilder } from "./action-plan-builder";
import { AntiLifeSection } from "./anti-life-section";
import { CompassReport } from "./compass-report";
import { DirectionsSection } from "./directions-section";
import { DriversSection } from "./drivers-section";
import { buildEvidenceAnswers } from "./evidence-drawer";
import { GoalsSection } from "./goals-section";
import { InfluencesSection } from "./influences-section";
import { PaidReflection } from "./paid-reflection";
import { PrivacyActions } from "./privacy-actions";
import { ReflectionCheckpoint } from "./reflection-checkpoint";
import { ResultHero } from "./result-hero";
import { ResultShell } from "./result-shell";
import { ResultError, ResultLoading, SafetyResult } from "./result-states";
import type { ResultsClient } from "./results.types";
import { StartTransition } from "./start-transition";
import { TensionsSection } from "./tensions-section";

export type { ResultsClient } from "./results.types";

type Props = { sessionId: string; locale?: Locale; client?: ResultsClient };

export function ResultsExperience({
  sessionId,
  locale = "en",
  client = api,
}: Props) {
  const t = useTranslations("Results");
  const [view, setView] = useState<SessionView | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [paidJourney, setPaidJourney] = useState<PaidJourney | null>(null);
  const [paidEvidence, setPaidEvidence] = useState<Record<string, unknown>>({});
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let current = await client.getSession(sessionId);
      if (!active) return;
      if (current.session.status === "safety_paused") {
        const paused = await client.analyze(sessionId, locale);
        if (active && paused.status === "safety_paused")
          setSafetyMessage(paused.message);
        return;
      }
      const checkout = new URLSearchParams(window.location.search).get(
        "checkout_session_id",
      );
      if (checkout) {
        setPaymentProcessing(true);
        let confirmed = false;
        for (let attempt = 0; attempt < 6; attempt++) {
          const status = await client.fulfillCheckout(checkout);
          if (!active) return;
          if (status === "failed") throw new Error("payment");
          if (status === "paid") {
            confirmed = true;
            break;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
        }
        setPaymentProcessing(false);
        if (!confirmed) {
          setError(t("paymentStillProcessing"));
          return;
        }
        current = await client.getSession(sessionId);
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (!active) return;
      setView(current);
      if (current.entitlements.includes("full_analysis")) {
        const journey = await client.startPaidJourney(sessionId);
        if (!active) return;
        setPaidJourney(journey);
      } else {
        const result = await client.getCheckpoint(sessionId, locale);
        if (!active) return;
        if (result.status === "safety_paused") setSafetyMessage(result.message);
        else setCheckpoint(result.checkpoint);
      }
    };
    void load().catch(() => {
      if (active) {
        setPaymentProcessing(false);
        setError(t("generateError"));
      }
    });
    return () => {
      active = false;
    };
  }, [client, locale, sessionId, t]);

  useEffect(() => {
    if (
      paidJourney?.stage !== "planning" &&
      paidJourney?.stage !== "synthesizing" &&
      paidJourney?.stage !== "generating"
    )
      return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const current = await client.getPaidJourney(sessionId);
        if (!active) return;
        setPaidJourney(current);
        if (current.stage === "ready") return;
      } catch {
        /* Temporary polling outages must not hide the paid journey. */
      }
      if (active) timer = setTimeout(poll, 2500);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paidJourney?.stage, client, sessionId]);

  useEffect(() => {
    if (paidJourney?.stage !== "ready" || analysis) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const full = await client.getCompass(sessionId);
        if (active) {
          setAnalysis(full.analysis.result);
          setPaidEvidence(full.evidence ?? {});
        }
      } catch {
        if (active) timer = setTimeout(load, 3000);
      }
    };
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paidJourney?.stage, analysis, client, sessionId]);

  useAnalyticsEvent(
    "checkpoint_viewed",
    "result",
    locale,
    undefined,
    Boolean(checkpoint),
  );
  useAnalyticsEvent(
    "direction_review_viewed",
    "result",
    locale,
    undefined,
    paidJourney?.stage === "reviewing",
  );
  useAnalyticsEvent(
    "generation_started",
    "result",
    locale,
    undefined,
    paidJourney?.stage === "generating",
  );
  useAnalyticsEvent(
    "report_ready",
    "result",
    locale,
    undefined,
    Boolean(analysis),
  );
  useAnalyticsEvent(
    "report_viewed",
    "result",
    locale,
    undefined,
    Boolean(analysis),
  );
  useAnalyticsEvent(
    "report_error",
    "result",
    locale,
    undefined,
    Boolean(error),
  );
  useAnalyticsEvent(
    "checkout_cancelled",
    "result",
    locale,
    undefined,
    typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("checkout") ===
        "cancelled",
  );

  if (error) return <ResultError message={error} />;
  if (safetyMessage) return <SafetyResult message={safetyMessage} />;
  if (paymentProcessing)
    return (
      <ResultLoading
        title={t("paymentProcessingTitle")}
        copy={t("paymentProcessing")}
      />
    );
  if (!view) return <ResultLoading />;
  if (paidJourney && !analysis)
    return (
      <PaidReflection
        journey={paidJourney}
        sessionId={sessionId}
        client={client}
        onUpdate={setPaidJourney}
      />
    );
  if (!analysis && checkpoint)
    return (
      <ReflectionCheckpoint
        checkpoint={checkpoint}
        sessionId={sessionId}
        view={view}
        purchasing={purchasing}
        error={purchaseError}
        onPurchase={() => {
          trackAnalytics("checkout_clicked", "result", locale);
          setPurchasing(true);
          setPurchaseError(null);
          void client
            .createCheckout(sessionId, locale)
            .then((checkout) => {
              if (checkout.status === "paid") window.location.reload();
              else window.location.assign(checkout.url);
            })
            .catch(() => {
              setPurchaseError(t("checkoutError"));
              trackAnalytics("checkout_error", "result", locale);
              setPurchasing(false);
            });
        }}
      />
    );

  if (!analysis) return <ResultLoading />;

  const evidenceAnswers = {
    ...buildEvidenceAnswers(view, locale, t("additionalFollowUp")),
    ...paidEvidence,
  };

  return (
    <ResultShell>
      <main>
        {analysis.compass ? (
          <CompassReport
            compass={analysis.compass}
            status={analysis.directionStatus ?? "not_reviewed"}
            locale={locale}
            answers={evidenceAnswers}
          />
        ) : (
          <ResultHero summary={analysis.summary} />
        )}
        {paidJourney?.delivery === "failed" ? (
          <output className="mx-auto block max-w-5xl px-6 py-4 text-sm">
            {locale === "de"
              ? "Dein Bericht ist fertig. Die E-Mail-Zustellung wird erneut versucht; du kannst dein PDF bereits speichern."
              : "Your report is ready. Email delivery is being retried; you can already save your PDF."}
          </output>
        ) : null}
        <div className="mx-auto max-w-5xl px-6 py-6 sm:px-10">
          <a
            className="inline-flex rounded border border-ink/20 bg-ink px-5 py-3 text-sm font-bold text-paper"
            href={`/api/sessions/${sessionId}/report.pdf?locale=${locale}`}
            onClick={() => trackAnalytics("pdf_download", "result", locale)}
          >
            {locale === "de"
              ? "Kompass als PDF speichern"
              : "Save your Compass as PDF"}
          </a>
          <p className="mt-2 text-xs text-muted">
            {locale === "de"
              ? "Mit deiner Richtung, deinem Plan und den zugehörigen Belegen."
              : "Includes your direction, action plan and supporting evidence."}
          </p>
        </div>
        {!analysis.compass ? (
          <>
            <DriversSection
              drivers={analysis.coreDrivers}
              answers={evidenceAnswers}
            />
            <TensionsSection
              tensions={analysis.tensions}
              answers={evidenceAnswers}
            />
            <AntiLifeSection
              antiLife={analysis.antiLife}
              answers={evidenceAnswers}
            />
            <InfluencesSection
              influences={analysis.externalInfluences}
              answers={evidenceAnswers}
            />
            <DirectionsSection
              directions={analysis.possibleDirections}
              answers={evidenceAnswers}
            />
            <GoalsSection goals={analysis.goals} answers={evidenceAnswers} />
            <StartTransition />
            <ActionPlanBuilder
              sessionId={sessionId}
              steps={analysis.firstSteps}
              answers={evidenceAnswers}
              savedPlan={view.actionPlan}
              onSave={(input) => client.saveActionPlan(sessionId, input)}
            />
          </>
        ) : null}
        <PrivacyActions
          sessionId={sessionId}
          onDelete={client.deleteSession}
          onResend={client.resendFullCompass}
        />
      </main>
    </ResultShell>
  );
}
