import { paymentEventSchema } from "@wtfiwant/shared";
import Stripe from "stripe";
import type {
  CheckoutDetails,
  CheckoutRequest,
  PaymentEvent,
  PaymentProvider,
} from "./payment";

const supportedEvents = new Set<PaymentEvent["type"]>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export class StripePaymentProvider implements PaymentProvider {
  private readonly stripe: Stripe;

  constructor(
    apiKey: string,
    private readonly priceId: string,
    private readonly webhookSecret: string,
    private readonly automaticTax: boolean,
  ) {
    this.stripe = new Stripe(apiKey);
  }

  async createCheckout(input: CheckoutRequest) {
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price: this.priceId, quantity: 1 }],
        client_reference_id: input.sessionId,
        metadata: { reflection_session_id: input.sessionId },
        locale: input.locale,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        automatic_tax: { enabled: this.automaticTax },
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );
    if (!session.url) throw new Error("Stripe Checkout has no redirect URL");
    return { id: session.id, url: session.url };
  }

  async retrieveCheckout(id: string): Promise<CheckoutDetails> {
    const session = await this.stripe.checkout.sessions.retrieve(id);
    const paymentIntent = session.payment_intent;
    const paymentStatus: CheckoutDetails["paymentStatus"] =
      String(session.payment_status) === "paid"
        ? "paid"
        : String(session.payment_status) === "no_payment_required"
          ? "no_payment_required"
          : "unpaid";
    return {
      id: session.id,
      sessionId:
        session.client_reference_id ??
        session.metadata?.reflection_session_id ??
        "",
      checkoutStatus:
        session.status === "complete"
          ? "complete"
          : session.status === "expired"
            ? "expired"
            : "open",
      paymentStatus,
      recipientEmail: session.customer_details?.email ?? null,
      paymentIntentId:
        typeof paymentIntent === "string"
          ? paymentIntent
          : (paymentIntent?.id ?? null),
      currency: session.currency,
      amountTotal: session.amount_total,
    };
  }

  parseWebhook(payload: string, signature: string): PaymentEvent {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
    if (!supportedEvents.has(event.type as PaymentEvent["type"]))
      throw new Error("Unsupported Stripe event");
    const checkoutSessionId =
      "id" in event.data.object ? event.data.object.id : "";
    return paymentEventSchema.parse({
      id: event.id,
      type: event.type,
      checkoutSessionId,
    });
  }
}
