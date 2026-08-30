import { describe, expect, test } from "bun:test";
import { sessionViewSchema } from "@wtfiwant/shared";
import { createApp } from "../src/app";
import type {
  CheckoutDetails,
  CheckoutRequest,
  PaymentEvent,
  PaymentProvider,
} from "../src/commerce/payment";
import type {
  EmailDeliveryProvider,
  FullCompassEmail,
} from "../src/email/provider";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

class FakePayments implements PaymentProvider {
  readonly checkouts = new Map<string, CheckoutDetails>();

  async createCheckout(input: CheckoutRequest) {
    const id = `cs_test_${input.sessionId}`;
    this.checkouts.set(id, {
      id,
      sessionId: input.sessionId,
      paymentStatus: "paid",
      recipientEmail: "person@example.com",
      paymentIntentId: "pi_test_paid",
      currency: "eur",
      amountTotal: 1900,
    });
    return { id, url: `https://checkout.stripe.test/${id}` };
  }

  async retrieveCheckout(id: string) {
    const checkout = this.checkouts.get(id);
    if (!checkout) throw new Error("Unknown checkout");
    return checkout;
  }

  parseWebhook(_payload: string, signature: string): PaymentEvent {
    if (signature !== "valid") throw new Error("Invalid signature");
    const checkout = [...this.checkouts.values()][0];
    return {
      id: "evt_paid_once",
      type: "checkout.session.completed",
      checkoutSessionId: checkout.id,
    };
  }
}

class FakeEmail implements EmailDeliveryProvider {
  readonly sent: FullCompassEmail[] = [];

  async sendFullCompass(input: FullCompassEmail) {
    this.sent.push(input);
    return { messageId: "email_test_1" };
  }
}

describe("paid Full Compass", () => {
  test("does not offer Checkout for a safety-paused Reflection", async () => {
    const app = createApp({
      repository: new InMemoryAssessmentRepository(),
      paymentProvider: new FakePayments(),
    });
    const created = sessionViewSchema.parse(
      await (await app.request("/sessions", { method: "POST" })).json(),
    );
    await app.request(`/sessions/${created.session.id}/answers/life.chosen`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "I plan to end my life today" }),
    });
    await app.request(`/sessions/${created.session.id}/analyze`, {
      method: "POST",
    });

    const checkout = await app.request(
      `/sessions/${created.session.id}/checkout`,
      { method: "POST" },
    );
    expect(checkout.status).toBe(409);
    expect(await checkout.json()).toEqual({
      error: "Reflection paused for safety",
    });
  });

  test("fulfills a paid Checkout once when Stripe repeats a webhook", async () => {
    const payments = new FakePayments();
    const email = new FakeEmail();
    const app = createApp({
      repository: new InMemoryAssessmentRepository(),
      paymentProvider: payments,
      emailProvider: email,
      publicAppUrl: "https://wtfiwant.test",
    });
    const seeded = sessionViewSchema.parse(
      await (
        await app.request("/dev/seed/burned_out", { method: "POST" })
      ).json(),
    );

    const checkoutResponse = await app.request(
      `/sessions/${seeded.session.id}/checkout`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      },
    );
    expect(checkoutResponse.status).toBe(201);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const webhook = await app.request("/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "valid" },
        body: "signed event payload",
      });
      expect(webhook.status).toBe(200);
    }

    const full = await app.request(`/sessions/${seeded.session.id}/compass`);
    expect(full.status).toBe(200);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].to).toBe("person@example.com");
    expect(email.sent[0].analysis.result.summary).toBeTruthy();

    const resend = await app.request(
      `/sessions/${seeded.session.id}/report-email`,
      { method: "POST" },
    );
    expect(resend.status).toBe(200);
    expect(email.sent).toHaveLength(2);
    expect(email.sent[1].idempotencyKey).toContain("/resend/2");
  });
});
