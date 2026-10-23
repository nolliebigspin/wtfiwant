import type { FulfillmentStatus } from "@wtfiwant/shared";
import { buildAnalysisAnswers } from "../ai/analysis";
import type { AIProvider } from "../ai/provider";
import { type AnalyticsStore, analyticsBestEffort } from "../analytics/store";
import type { EmailDeliveryProvider } from "../email/provider";
import { buildEmailEvidence } from "../email/report";
import { ensurePaidPlan } from "../journey/service";
import type { AIJobStore } from "../journey/store";
import type {
  AssessmentRecord,
  AssessmentRepository,
} from "../repositories/types";
import { buildSafetyAnswers } from "../safety/answers";
import { classifySafety } from "../safety/classifier";
import { deliverCommerceNotifications } from "./notifications";
import type { PaymentProvider } from "./payment";

export async function fulfillCheckout({
  checkoutSessionId,
  repository,
  paymentProvider,
  aiProvider,
  analytics,
  jobs,
  emailProvider,
}: {
  checkoutSessionId: string;
  repository: AssessmentRepository;
  paymentProvider: PaymentProvider;
  emailProvider?: EmailDeliveryProvider;
  publicAppUrl: string;
  aiProvider: AIProvider;
  analytics?: AnalyticsStore;
  jobs: AIJobStore;
}): Promise<FulfillmentStatus> {
  const storedPurchase =
    await repository.getPurchaseByCheckout(checkoutSessionId);
  if (
    !storedPurchase &&
    (await repository.commerce.getPurchase(checkoutSessionId))
  )
    return "paid";
  if (
    storedPurchase?.status === "failed" ||
    storedPurchase?.status === "expired" ||
    storedPurchase?.status === "refunded"
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
  if (purchase.status !== "paid") return "failed";
  await deliverCommerceNotifications(
    repository.commerce,
    emailProvider,
    purchase.id,
  );
  await analyticsBestEffort(
    () =>
      analytics?.purchase(
        checkout.id,
        checkout.amountTotal,
        checkout.currency,
      ) ?? Promise.resolve(),
  );

  const record = await repository.getSession(purchase.sessionId);
  if (!record) throw new Error("Paid Reflection is unavailable");
  if (
    record.session.status === "safety_paused" ||
    classifySafety(buildSafetyAnswers(record)) === "immediate_self_harm_risk"
  ) {
    await repository.setStatus(record.session.id, "safety_paused");
    return "paid";
  }
  await ensurePaidPlan(
    jobs,
    record,
    purchase.agreement?.locale ?? record.analysis?.locale ?? "en",
    aiProvider,
  );
  // Delivery belongs to the background report job, never a Stripe webhook.

  return "paid";
}

export function buildReportEvidence(
  record: AssessmentRecord,
  frozenAnswers?: Record<string, unknown>,
): Record<string, unknown> {
  if (!record.analysis) return {};
  return buildEmailEvidence(
    record.analysis.result,
    frozenAnswers ?? buildAnalysisAnswers(record, record.analysis.locale),
  );
}
