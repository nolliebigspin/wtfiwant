import type { EmailDeliveryProvider } from "../email/provider";
import type { AssessmentRepository } from "../repositories/types";
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
}): Promise<"paid" | "processing"> {
  const checkout = await paymentProvider.retrieveCheckout(checkoutSessionId);
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
  if (!emailProvider) return "paid";

  const deliveryId = await repository.claimInitialDelivery(purchase.id);
  if (!deliveryId) return "paid";
  try {
    const sent = await emailProvider.sendFullCompass({
      to: checkout.recipientEmail,
      locale: record.analysis.locale,
      analysis: record.analysis,
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
