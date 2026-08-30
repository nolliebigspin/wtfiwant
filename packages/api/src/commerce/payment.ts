import type { Locale } from "@wtfiwant/shared";

export type CheckoutRequest = {
  sessionId: string;
  locale: Locale;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutDetails = {
  id: string;
  sessionId: string;
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  recipientEmail: string | null;
  paymentIntentId: string | null;
  currency: string | null;
  amountTotal: number | null;
};

export type PaymentEvent = {
  id: string;
  type:
    | "checkout.session.completed"
    | "checkout.session.async_payment_succeeded"
    | "checkout.session.async_payment_failed"
    | "checkout.session.expired";
  checkoutSessionId: string;
};

export interface PaymentProvider {
  createCheckout(input: CheckoutRequest): Promise<{ id: string; url: string }>;
  retrieveCheckout(id: string): Promise<CheckoutDetails>;
  parseWebhook(payload: string, signature: string): PaymentEvent;
}
