import { describe, expect, test } from "bun:test";
import { COACH_PROMPT_VERSION, sessionViewSchema } from "@wtfiwant/shared";
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

const legalLinks = {
  termsUrl: "https://wtfiwant.test/terms",
  refundPolicyUrl: "https://wtfiwant.test/refunds",
};

class FakePayments implements PaymentProvider {
  readonly checkouts = new Map<string, CheckoutDetails>();
  retrieveCalls = 0;
  createCalls = 0;
  retrieveErrorOnce = false;
  event: PaymentEvent | null = null;

  async createCheckout(input: CheckoutRequest) {
    this.createCalls += 1;
    const id = `cs_test_${input.sessionId}_${this.createCalls}`;
    this.checkouts.set(id, {
      id,
      sessionId: input.sessionId,
      checkoutStatus: "complete",
      paymentStatus: "paid",
      recipientEmail: "person@example.com",
      paymentIntentId: "pi_test_paid",
      currency: "eur",
      amountTotal: 1900,
    });
    return { id, url: `https://checkout.stripe.test/${id}` };
  }

  async retrieveCheckout(id: string) {
    this.retrieveCalls += 1;
    if (this.retrieveErrorOnce) {
      this.retrieveErrorOnce = false;
      throw new Error("Temporary Stripe outage");
    }
    const checkout = this.checkouts.get(id);
    if (!checkout) throw new Error("Unknown checkout");
    return checkout;
  }

  parseWebhook(_payload: string, signature: string): PaymentEvent {
    if (signature !== "valid") throw new Error("Invalid signature");
    if (this.event) return this.event;
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
  test("validates Checkout IDs and normalized webhook events before fulfillment", async () => {
    const payments = new FakePayments();
    const app = createApp({
      legalLinks,
      repository: new InMemoryAssessmentRepository(),
      paymentProvider: payments,
      emailProvider: new FakeEmail(),
    });

    const malformedId = await app.request("/checkout/not-stripe/fulfill", {
      method: "POST",
    });
    expect(malformedId.status).toBe(400);
    expect(payments.retrieveCalls).toBe(0);

    payments.event = {
      id: "not a Stripe event",
      type: "checkout.session.completed",
      checkoutSessionId: "also invalid",
    };
    const malformedEvent = await app.request("/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "valid" },
      body: "signed event payload",
    });
    expect(malformedEvent.status).toBe(400);
    expect(payments.retrieveCalls).toBe(0);
  });

  test("does not offer Checkout for a safety-paused Reflection", async () => {
    const app = createApp({
      legalLinks,
      repository: new InMemoryAssessmentRepository(),
      paymentProvider: new FakePayments(),
      emailProvider: new FakeEmail(),
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
    let now = Date.now();
    const payments = new FakePayments();
    const email = new FakeEmail();
    const app = createApp({
      legalLinks,
      repository: new InMemoryAssessmentRepository(() => now),
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

    const webhooks = await Promise.all(
      Array.from({ length: 2 }, () =>
        app.request("/stripe/webhook", {
          method: "POST",
          headers: { "stripe-signature": "valid" },
          body: "signed event payload",
        }),
      ),
    );
    for (const webhook of webhooks) {
      expect(webhook.status).toBe(200);
    }

    const full = await app.request(`/sessions/${seeded.session.id}/compass`);
    expect(full.status).toBe(200);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].to).toBe("person@example.com");
    expect(email.sent[0].analysis.result.summary).toBeTruthy();

    const tooSoon = await app.request(
      `/sessions/${seeded.session.id}/report-email`,
      { method: "POST" },
    );
    expect(tooSoon.status).toBe(409);
    now += 60_000;
    const resend = await app.request(
      `/sessions/${seeded.session.id}/report-email`,
      { method: "POST" },
    );
    expect(resend.status).toBe(200);
    expect(email.sent).toHaveLength(2);
    expect(email.sent[1].idempotencyKey).toContain("/resend/2");
  });

  test("keeps delayed payments locked and reports expired Checkouts as failed", async () => {
    const repository = new InMemoryAssessmentRepository();
    const payments = new FakePayments();
    const app = createApp({
      legalLinks,
      repository,
      paymentProvider: payments,
      emailProvider: new FakeEmail(),
    });
    const seeded = sessionViewSchema.parse(
      await (
        await app.request("/dev/seed/burned_out", { method: "POST" })
      ).json(),
    );
    await app.request(`/sessions/${seeded.session.id}/checkout`, {
      method: "POST",
    });
    const checkout = [...payments.checkouts.values()][0];
    checkout.paymentStatus = "unpaid";

    const processing = await app.request(`/checkout/${checkout.id}/fulfill`, {
      method: "POST",
    });
    expect(await processing.json()).toEqual({ status: "processing" });
    expect(
      (await repository.getSession(seeded.session.id))?.entitlements,
    ).toEqual(["assessment"]);

    checkout.checkoutStatus = "expired";
    const expired = await app.request(`/checkout/${checkout.id}/fulfill`, {
      method: "POST",
    });
    expect(await expired.json()).toEqual({ status: "failed" });
    expect(
      (await repository.getSession(seeded.session.id))?.entitlements,
    ).toEqual(["assessment"]);

    const replacement = (await (
      await app.request(`/sessions/${seeded.session.id}/checkout`, {
        method: "POST",
      })
    ).json()) as { checkoutSessionId: string };
    expect(replacement.checkoutSessionId).not.toBe(checkout.id);

    const replacementCheckout = payments.checkouts.get(
      replacement.checkoutSessionId,
    );
    if (!replacementCheckout) throw new Error("Replacement Checkout missing");
    replacementCheckout.checkoutStatus = "complete";
    replacementCheckout.paymentStatus = "paid";
    payments.event = {
      id: "evt_async_paid",
      type: "checkout.session.async_payment_succeeded",
      checkoutSessionId: replacementCheckout.id,
    };
    const succeeded = await app.request("/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "valid" },
      body: "signed event payload",
    });
    expect(succeeded.status).toBe(200);
    expect(
      (await repository.getSession(seeded.session.id))?.entitlements,
    ).toEqual(["assessment", "full_analysis"]);
  });

  test("retries a webhook after transient fulfillment failure", async () => {
    const repository = new InMemoryAssessmentRepository();
    const payments = new FakePayments();
    const app = createApp({
      legalLinks,
      repository,
      paymentProvider: payments,
      emailProvider: new FakeEmail(),
    });
    const seeded = sessionViewSchema.parse(
      await (
        await app.request("/dev/seed/burned_out", { method: "POST" })
      ).json(),
    );
    await app.request(`/sessions/${seeded.session.id}/checkout`, {
      method: "POST",
    });
    payments.retrieveErrorOnce = true;

    const first = await app.request("/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "valid" },
      body: "signed event payload",
    });
    const retry = await app.request("/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "valid" },
      body: "signed event payload",
    });

    expect(first.status).toBe(500);
    expect(retry.status).toBe(200);
    expect(
      (await repository.getSession(seeded.session.id))?.entitlements,
    ).toEqual(["assessment", "full_analysis"]);
  });

  test("records payment but withholds entitlement and email after a safety pause", async () => {
    const repository = new InMemoryAssessmentRepository();
    const payments = new FakePayments();
    const email = new FakeEmail();
    const app = createApp({
      legalLinks,
      repository,
      paymentProvider: payments,
      emailProvider: email,
    });
    const seeded = sessionViewSchema.parse(
      await (
        await app.request("/dev/seed/burned_out", { method: "POST" })
      ).json(),
    );
    await app.request(`/sessions/${seeded.session.id}/checkout`, {
      method: "POST",
    });
    await repository.saveCoachPrompt(seeded.session.id, {
      id: crypto.randomUUID(),
      chapter: "goals",
      question: "What feels most urgent?",
      evidenceQuestionIds: ["goals.current"],
      promptVersion: COACH_PROMPT_VERSION,
      locale: "en",
      userResponse: "I plan to end my life today",
      resolvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    const checkoutId = [...payments.checkouts.keys()][0];

    const fulfilled = await app.request(`/checkout/${checkoutId}/fulfill`, {
      method: "POST",
    });

    expect(fulfilled.status).toBe(200);
    expect(
      (await repository.getSession(seeded.session.id))?.entitlements,
    ).toEqual(["assessment"]);
    expect(email.sent).toHaveLength(0);
  });

  test("blocks Compass and email delivery while a paid Reflection is safety-paused", async () => {
    const repository = new InMemoryAssessmentRepository();
    const payments = new FakePayments();
    const email = new FakeEmail();
    const app = createApp({
      legalLinks,
      repository,
      paymentProvider: payments,
      emailProvider: email,
    });
    const seeded = sessionViewSchema.parse(
      await (
        await app.request("/dev/seed/burned_out", { method: "POST" })
      ).json(),
    );
    await app.request(`/sessions/${seeded.session.id}/checkout`, {
      method: "POST",
    });
    const checkoutId = [...payments.checkouts.keys()][0];
    await app.request(`/checkout/${checkoutId}/fulfill`, { method: "POST" });
    await repository.setStatus(seeded.session.id, "safety_paused");

    const [legacy, compass, resend] = await Promise.all([
      app.request(`/sessions/${seeded.session.id}/analysis`),
      app.request(`/sessions/${seeded.session.id}/compass`),
      app.request(`/sessions/${seeded.session.id}/report-email`, {
        method: "POST",
      }),
    ]);

    expect([legacy.status, compass.status, resend.status]).toEqual([
      409, 409, 409,
    ]);
    expect(email.sent).toHaveLength(1);
  });
});
