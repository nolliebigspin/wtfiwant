"use client";

import type {
  Analysis,
  AnalysisPreview,
  Locale,
  SessionView,
} from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ActionPlanBuilder } from "./action-plan-builder";
import { AntiLifeSection } from "./anti-life-section";
import { CompassPreview } from "./compass-preview";
import { DirectionsSection } from "./directions-section";
import { DriversSection } from "./drivers-section";
import { buildEvidenceAnswers } from "./evidence-drawer";
import { GoalsSection } from "./goals-section";
import { InfluencesSection } from "./influences-section";
import { PrivacyActions } from "./privacy-actions";
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
  const [preview, setPreview] = useState<AnalysisPreview | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .getSession(sessionId)
      .then(async (restored) => {
        if (!active) return;
        let current = restored;
        const checkoutSessionId = new URLSearchParams(
          window.location.search,
        ).get("checkout_session_id");
        if (checkoutSessionId) {
          const status = await client.fulfillCheckout(checkoutSessionId);
          if (status === "processing") {
            setError(t("paymentProcessing"));
            return;
          }
          current = await client.getSession(sessionId);
          window.history.replaceState({}, "", window.location.pathname);
        }
        setView(current);
        if (current.entitlements.includes("full_analysis")) {
          const full = await client.getCompass(sessionId);
          if (full.analysis.locale === locale)
            setAnalysis(full.analysis.result);
          else {
            const translated = await client.analyze(sessionId, locale);
            if (translated.status === "complete")
              setAnalysis(translated.analysis.result);
            else if (translated.status === "safety_paused")
              setSafetyMessage(translated.message);
          }
          return;
        }
        if (current.preview?.locale === locale) {
          setPreview(current.preview);
          return;
        }
        const generated = await client.analyze(sessionId, locale);
        if (!active) return;
        if (generated.status === "safety_paused")
          setSafetyMessage(generated.message);
        else if (generated.status === "preview_ready")
          setPreview(generated.preview);
        else setAnalysis(generated.analysis.result);
      })
      .catch(() => active && setError(t("generateError")));
    return () => {
      active = false;
    };
  }, [client, locale, sessionId, t]);

  if (error) return <ResultError message={error} />;
  if (safetyMessage) return <SafetyResult message={safetyMessage} />;
  if (!view || (!analysis && !preview)) return <ResultLoading />;

  if (!analysis && preview)
    return (
      <CompassPreview
        preview={preview}
        purchasing={purchasing}
        error={purchaseError}
        onPurchase={() => {
          setPurchasing(true);
          setPurchaseError(null);
          void client
            .createCheckout(sessionId, locale)
            .then((checkout) => {
              if (checkout.status === "paid") return window.location.reload();
              window.location.assign(checkout.url);
            })
            .catch(() => {
              setPurchaseError(t("checkoutError"));
              setPurchasing(false);
            });
        }}
      />
    );

  if (!analysis) return <ResultLoading />;

  const evidenceAnswers = buildEvidenceAnswers(
    view,
    locale,
    t("additionalFollowUp"),
  );

  return (
    <ResultShell>
      <main>
        <ResultHero summary={analysis.summary} />
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
        <PrivacyActions
          sessionId={sessionId}
          onDelete={client.deleteSession}
          onResend={client.resendFullCompass}
        />
      </main>
    </ResultShell>
  );
}
