import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { createCommerceProviders } from "../src/commerce/config";
import { LocalEmailDeliveryProvider } from "../src/email/local";
import { withdrawalConfirmation } from "../src/email/withdrawal";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

describe("statutory withdrawal declarations", () => {
  test("keeps withdrawal confirmation available when new purchases are disabled", () => {
    const providers = createCommerceProviders({
      NODE_ENV: "test",
      PAYMENTS_ENABLED: "false",
      EMAIL_PROVIDER: "local",
    });
    expect(providers.paymentProvider).toBeUndefined();
    expect(providers.emailProvider).toBeInstanceOf(LocalEmailDeliveryProvider);
  });
  for (const locale of ["en", "de"] as const) {
    test(`records and confirms a ${locale} declaration without an account or reason`, async () => {
      const repository = new InMemoryAssessmentRepository();
      const email = new LocalEmailDeliveryProvider();
      const app = createApp({ repository, emailProvider: email });
      const input = {
        requestId: crypto.randomUUID(),
        name: "Example Customer",
        email: "customer@example.com",
        contractReference: "Full Compass bought on 2026-09-07",
        locale,
      };
      const request = () =>
        app.request("/withdrawals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
      const first = await request();
      expect(first.status).toBe(201);
      const receipt = await first.json();
      expect(receipt.confirmationSent).toBe(true);
      expect(await (await request()).json()).toEqual(receipt);
      expect(email.withdrawals).toHaveLength(1);
      const confirmation = withdrawalConfirmation(email.withdrawals[0]);
      for (const value of [
        input.name,
        input.email,
        input.contractReference,
        receipt.receivedAt,
      ])
        expect(confirmation.text).toContain(value);
      expect(confirmation.text).toContain(
        locale === "de" ? "Hiermit widerrufe ich" : "I hereby withdraw",
      );
    });
  }

  test("preserves receipt time when email fails and confirmation is retried", async () => {
    let now = Date.now();
    const repository = new InMemoryAssessmentRepository(() => now);
    class UnavailableEmail extends LocalEmailDeliveryProvider {
      async sendWithdrawalConfirmation(): Promise<{ messageId: string }> {
        throw new Error("Unavailable");
      }
    }
    const failingApp = createApp({
      repository,
      emailProvider: new UnavailableEmail(),
    });
    const input = {
      requestId: crypto.randomUUID(),
      name: "Customer",
      email: "customer@example.com",
      contractReference: "Full Compass, 7 September",
      locale: "en",
    };
    const init = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    };
    const first = await (await failingApp.request("/withdrawals", init)).json();
    expect(first).toEqual({
      receivedAt: new Date(now).toISOString(),
      confirmationSent: false,
    });
    now += 60000;
    const email = new LocalEmailDeliveryProvider();
    const recoveredApp = createApp({ repository, emailProvider: email });
    const second = await (
      await recoveredApp.request("/withdrawals", init)
    ).json();
    expect(second).toEqual({ ...first, confirmationSent: true });
    expect(email.withdrawals[0].receivedAt).toBe(first.receivedAt);
  });

  test("rejects malformed declarations before persistence or email", async () => {
    const email = new LocalEmailDeliveryProvider();
    const app = createApp({
      repository: new InMemoryAssessmentRepository(),
      emailProvider: email,
    });
    const response = await app.request("/withdrawals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "invalid",
        name: "",
        contractReference: "",
      }),
    });
    expect(response.status).toBe(400);
    expect(email.withdrawals).toHaveLength(0);
  });
});
