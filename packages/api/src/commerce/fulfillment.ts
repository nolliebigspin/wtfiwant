import type { FulfillmentStatus } from "@wtfiwant/shared";
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
}: {
  checkoutSessionId: string;
  repository: AssessmentRepository;
  paymentProvider: PaymentProvider;
  emailProvider?: EmailDeliveryProvider;
  publicAppUrl: string;
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

  const purchase = await repository.markPurchasePaid({
    checkoutSessionId: checkout.id,
    paymentIntentId: checkout.paymentIntentId,
    recipientEmail: checkout.recipientEmail,
    currency: checkout.currency,
    amountTotal: checkout.amountTotal,
  });
  if (!purchase) throw new Error("Checkout is not linked to a Reflection");

  const record = await repository.getSession(purchase.sessionId);
  if (!record?.analysis) throw new Error("Paid Reflection has no Compass");
  const evidence = buildReportEvidence(record);
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
    const sent = await emailProvider.sendFullCompass({
      to: checkout.recipientEmail,
      locale: record.analysis.locale,
      analysis: record.analysis,
      evidence,
      resultUrl: `${publicAppUrl}/${record.analysis.locale}/result/${record.session.id}`,
      idempotencyKey: `full-compass/${purchase.id}`,
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
  const source = {
    ...record.answers,
    ...Object.fromEntries(
      record.followUps.flatMap((prompt) =>
        prompt.userResponse
          ? [
              [
                `followup:${prompt.questionId}:${prompt.id}`,
                {
                  question: prompt.generatedQuestion,
                  answer: prompt.userResponse,
                },
              ],
            ]
          : [],
      ),
    ),
    ...Object.fromEntries(
      record.coachPrompts.flatMap((prompt) =>
        prompt.userResponse
          ? [
              [
                `coach:${prompt.chapter}:${prompt.id}`,
                { question: prompt.question, answer: prompt.userResponse },
              ],
            ]
          : [],
      ),
    ),
  };
  return buildEmailEvidence(record.analysis.result, source);
}
