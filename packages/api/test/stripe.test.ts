import { describe, expect, test } from "bun:test";
import { createDigitalPurchaseAgreement } from "@wtfiwant/shared";
import Stripe from "stripe";
import { StripePaymentProvider } from "../src/commerce/stripe";

function httpClient(
  fetcher: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>,
) {
  return Stripe.createFetchHttpClient(
    Object.assign(fetcher, { preconnect() {} }),
  );
}

describe("Stripe digital delivery consent", () => {
  test("continues to verify signed Checkout events with async crypto", async () => {
    const secret = "whsec_checkout_unit_test";
    const provider = new StripePaymentProvider(
      "sk_test_example",
      "price_test",
      secret,
      false,
    );
    const payload = JSON.stringify({
      id: "evt_signed_checkout",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_signed" } },
    });
    const signature = await Stripe.webhooks.generateTestHeaderStringAsync({
      payload,
      secret,
    });
    expect(await provider.parseWebhook(payload, signature)).toEqual({
      id: "evt_signed_checkout",
      type: "checkout.session.completed",
      checkoutSessionId: "cs_test_signed",
    });
    await expect(
      provider.parseWebhook(
        payload.replace("cs_test_signed", "cs_test_tampered"),
        signature,
      ),
    ).rejects.toThrow();
  });
  test("normalizes signed refund/dispute events without storing card or customer details", async () => {
    const secret = "whsec_unit_test_only";
    const provider = new StripePaymentProvider(
      "sk_test_example",
      "price_test",
      secret,
      false,
    );
    for (const type of [
      "charge.refunded",
      "charge.dispute.created",
      "charge.dispute.closed",
    ] as const) {
      const payload = JSON.stringify({
        id: "evt_signed_adjustment",
        object: "event",
        type,
        data: {
          object: {
            id: "ch_or_dp_example",
            payment_intent: "pi_example",
            amount: 1900,
            amount_refunded: 1900,
            currency: "eur",
            status: "won",
            customer: "customer_secret",
            billing_details: { email: "not-retained@example.com" },
          },
        },
      });
      const signature = await Stripe.webhooks.generateTestHeaderStringAsync({
        payload,
        secret,
      });
      const result = await provider.parseWebhook(payload, signature);
      expect(result.type).toBe(type);
      expect(JSON.stringify(result)).not.toContain("not-retained@example.com");
      expect(JSON.stringify(result)).not.toContain("customer_secret");
      await expect(provider.parseWebhook(payload, "invalid")).rejects.toThrow();
    }
  });
  for (const locale of ["en", "de"] as const) {
    test(`requires an explicit checkbox with the ${locale} consent text on hosted Checkout`, async () => {
      let body = new URLSearchParams();
      const stripe = new Stripe("sk_test_example", {
        httpClient: httpClient(async (_url, init) => {
          body = new URLSearchParams(String(init?.body));
          return Response.json({
            id: "cs_test_example",
            url: "https://checkout.stripe.test/example",
          });
        }),
      });
      const provider = new StripePaymentProvider(
        "",
        "price_test",
        "",
        false,
        stripe,
      );
      const agreement = createDigitalPurchaseAgreement(locale);
      await provider.createCheckout({
        sessionId: crypto.randomUUID(),
        locale,
        agreement,
        successUrl: "https://wtfiwant.test/success",
        cancelUrl: "https://wtfiwant.test/cancel",
        termsUrl: "https://wtfiwant.test/terms",
        refundPolicyUrl: "https://wtfiwant.test/refunds",
        idempotencyKey: "test-only",
      });
      expect(body.get("consent_collection[terms_of_service]")).toBe("required");
      expect(body.get("submit_type")).toBe("pay");
      expect(
        body.get("custom_text[terms_of_service_acceptance][message]"),
      ).toBe(agreement.statement);
      expect(body.get("metadata[agreement_version]")).toBe(agreement.version);
      expect(body.get("custom_text[submit][message]")).toContain(
        "https://wtfiwant.test/refunds",
      );
      expect(body.has("consent[terms_of_service]")).toBe(false);
    });
  }

  test("only treats Stripe's accepted value as consent", async () => {
    for (const consent of [
      null,
      { terms_of_service: null },
      { terms_of_service: "accepted" },
    ]) {
      const stripe = new Stripe("sk_test_example", {
        httpClient: httpClient(async () =>
          Response.json({
            id: "cs_test_example",
            status: "complete",
            payment_status: "paid",
            consent,
          }),
        ),
      });
      const provider = new StripePaymentProvider(
        "",
        "price_test",
        "",
        false,
        stripe,
      );
      expect(
        (await provider.retrieveCheckout("cs_test_example")).consentAccepted,
      ).toBe(consent?.terms_of_service === "accepted");
    }
  });
});
