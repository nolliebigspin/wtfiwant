import type {
  DigitalPurchaseAgreement,
  Locale,
  PaymentEvent,
} from "@wtfiwant/shared";

export type CheckoutRequest = {
  sessionId: string;
  locale: Locale;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  agreement: DigitalPurchaseAgreement;
  termsUrl: string;
  refundPolicyUrl: string;
};

export type CheckoutDetails = {
  id: string;
  sessionId: string;
  checkoutStatus: "open" | "complete" | "expired";
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  recipientEmail: string | null;
  paymentIntentId: string | null;
  currency: string | null;
  amountTotal: number | null;
  consentAccepted: boolean;
};

export type { PaymentEvent } from "@wtfiwant/shared";

export interface PaymentProvider {
  createCheckout(input: CheckoutRequest): Promise<{ id: string; url: string }>;
  retrieveCheckout(id: string): Promise<CheckoutDetails>;
  parseWebhook(payload: string, signature: string): PaymentEvent;
}
