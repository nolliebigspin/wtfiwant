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
