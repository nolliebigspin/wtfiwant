import type { FulfillmentStatus } from "@wtfiwant/shared";
import { analysisInLocale, buildAnalysisAnswers } from "../ai/analysis";
import type { AIProvider } from "../ai/provider";
import { type AnalyticsStore, analyticsBestEffort } from "../analytics/store";
import type { EmailDeliveryProvider } from "../email/provider";
import { buildEmailEvidence } from "../email/report";
import type {
  AssessmentRecord,
  AssessmentRepository,
} from "../repositories/types";
import { buildSafetyAnswers } from "../safety/answers";
import { classifySafety } from "../safety/classifier";
import type { PaymentProvider } from "./payment";

export async function fulfillCheckout({
  checkoutSessionId,
  repository,
  paymentProvider,
  emailProvider,
  publicAppUrl,
  aiProvider,
  analytics,
}: {
  checkoutSessionId: string;
  repository: AssessmentRepository;
  paymentProvider: PaymentProvider;
  emailProvider?: EmailDeliveryProvider;
  publicAppUrl: string;
  aiProvider: AIProvider;
  analytics?: AnalyticsStore;
}): Promise<FulfillmentStatus> {
  const storedPurchase =
    await repository.getPurchaseByCheckout(checkoutSessionId);
  if (
    storedPurchase?.status === "failed" ||
    storedPurchase?.status === "expired"
  )
    return "failed";
  const checkout = await paymentProvider.retrieveCheckout(checkoutSessionId);
  if (checkout.checkoutStatus === "expired") {
    await repository.setPurchaseStatusByCheckout(checkout.id, "expired");
    return "failed";
  }
  if (checkout.paymentStatus !== "paid") return "processing";
  if (!checkout.recipientEmail)
    throw new Error("Paid Checkout is missing its recipient email");
  if (!storedPurchase || checkout.sessionId !== storedPurchase.sessionId)
    throw new Error("Checkout is not linked to this Reflection");
  if (storedPurchase.agreement && !checkout.consentAccepted)
    throw new Error("Paid Checkout is missing digital delivery consent");

  const purchase = await repository.markPurchasePaid({
    checkoutSessionId: checkout.id,
    paymentIntentId: checkout.paymentIntentId,
    recipientEmail: checkout.recipientEmail,
    currency: checkout.currency,
    amountTotal: checkout.amountTotal,
    consentRecordedAt: storedPurchase.agreement
      ? (storedPurchase.consentRecordedAt ?? new Date().toISOString())
      : null,
  });
  if (!purchase) throw new Error("Checkout is not linked to a Reflection");
  await analyticsBestEffort(
    () =>
      analytics?.purchase(
        checkout.id,
        checkout.amountTotal,
        checkout.currency,
      ) ?? Promise.resolve(),
  );

  const record = await repository.getSession(purchase.sessionId);
  if (!record?.analysis) throw new Error("Paid Reflection has no Compass");
  if (
    record.session.status === "safety_paused" ||
    classifySafety(buildSafetyAnswers(record)) === "immediate_self_harm_risk"
  ) {
    await repository.setStatus(record.session.id, "safety_paused");
    return "paid";
  }
  if (!emailProvider) return "paid";

  const deliveryId = await repository.claimInitialDelivery(purchase.id);
  if (!deliveryId) return "paid";
  try {
    const analysis = await analysisInLocale(
      aiProvider,
      record,
      purchase.agreement?.locale ?? record.analysis.locale,
    );
    const sent = await emailProvider.sendFullCompass({
      to: checkout.recipientEmail,
      locale: analysis.locale,
      analysis,
      evidence: buildReportEvidence({ ...record, analysis }),
      actionPlan: record.actionPlan,
      resultUrl: `${publicAppUrl}/${analysis.locale}/result/${record.session.id}`,
      idempotencyKey: `full-compass/${purchase.id}`,
      purchase,
    });
    await repository.markDeliverySent(deliveryId, sent.messageId);
  } catch (error) {
    await repository.markDeliveryFailed(
      deliveryId,
      error instanceof Error ? error.name : "EmailDeliveryError",
    );
  }
  return "paid";
}

export function buildReportEvidence(
  record: AssessmentRecord,
): Record<string, unknown> {
  if (!record.analysis) return {};
  return buildEmailEvidence(
    record.analysis.result,
    buildAnalysisAnswers(record, record.analysis.locale),
  );
}
