import { describe, expect, test } from "bun:test";
import {
  createDigitalPurchaseAgreement,
  JOURNEY_VERSION,
  type PaymentAdjustment,
  type PurchaseReceipt,
} from "@wtfiwant/shared";
import { createApp } from "../src/app";
import { deliverCommerceNotifications } from "../src/commerce/notifications";
import { LocalEmailDeliveryProvider } from "../src/email/local";
import { purchaseConfirmation } from "../src/email/report";
import { InMemoryAIJobStore } from "../src/journey/store";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

async function paid(
  repository: InMemoryAssessmentRepository,
  paymentIntentId = `pi_${crypto.randomUUID()}`,
) {
  const record = await repository.createSession();
  const checkout = {
    id: `cs_test_${crypto.randomUUID()}`,
    url: "https://checkout.stripe.test/qa",
  };
  await repository.saveAnswer(
    record.session.id,
    "life.chosen",
    "FICTIONAL_PRIVATE_ANSWER",
  );
  await repository.saveCheckout(
    record.session.id,
    checkout,
    createDigitalPurchaseAgreement("de"),
  );
  const purchase = await repository.markPurchasePaid({
    checkoutSessionId: checkout.id,
    paymentIntentId,
    recipientEmail: "customer@example.com",
    currency: "eur",
    amountTotal: 1900,
    consentRecordedAt: new Date().toISOString(),
  });
  if (!purchase) throw Error("Missing test purchase");
  return { record, checkout, purchase };
}

describe("legal purchase evidence and reliable confirmations", () => {
  test("preserves an immutable minimal receipt after deleting all reflection content", async () => {
    const repository = new InMemoryAssessmentRepository();
    const { record, checkout, purchase } = await paid(repository);
    const before = await repository.commerce.getPurchase(checkout.id);
    await repository.markPurchasePaid({
      checkoutSessionId: checkout.id,
      paymentIntentId: purchase.paymentIntentId,
      recipientEmail: "changed@example.com",
      currency: "eur",
      amountTotal: 1900,
      consentRecordedAt: new Date().toISOString(),
    });
    expect(await repository.commerce.getPurchase(checkout.id)).toEqual(before);
    await repository.deleteSession(record.session.id);
    expect(await repository.getSession(record.session.id)).toBeNull();
    expect(await repository.getPurchaseByCheckout(checkout.id)).toBeNull();
    const receipt = await repository.commerce.getPurchase(checkout.id);
    expect(receipt).toEqual(before);
    expect(JSON.stringify(receipt)).not.toContain("FICTIONAL_PRIVATE_ANSWER");
    expect(JSON.stringify(receipt)).not.toContain(record.session.id);
    const email = new LocalEmailDeliveryProvider();
    await deliverCommerceNotifications(repository.commerce, email);
    expect(email.confirmations).toHaveLength(1);
    expect(email.sent).toHaveLength(0);
    expect(purchaseConfirmation(receipt ?? undefined, false)).toContain(
      purchase.agreement?.terms ?? "missing",
    );
    const confirmation = purchaseConfirmation(receipt ?? undefined, false);
    expect(confirmation).toContain("Blumenau 89");
    expect(confirmation).toContain("22089 Hamburg");
    expect(confirmation).toContain("+49 178 1705600");
    expect(confirmation).toContain("Anschrift der widerrufenden Person(en)");
    expect(purchaseConfirmation(receipt ?? undefined, false)).not.toContain(
      "FICTIONAL_PRIVATE_ANSWER",
    );
    await deliverCommerceNotifications(repository.commerce, email, purchase.id);
    expect(email.confirmations).toHaveLength(1);
  });

  test("waits for purchase confirmation without consuming an AI attempt and recovers automatically", async () => {
    let now = Date.now();
    const repository = new InMemoryAssessmentRepository(() => now);
    const { record, purchase } = await paid(repository);
    const jobs = new InMemoryAIJobStore(repository, () => now);
    await jobs.enqueue(record.session.id, "plan", "de", {
      answers: {},
      model: "unused",
      version: JOURNEY_VERSION,
    });
    expect(await jobs.claim()).toBeNull();
    expect((await jobs.get(record.session.id, "plan"))?.attempts).toBe(0);
    const app = createApp({ repository, jobs });
    expect(
      await (await app.request(`/sessions/${record.session.id}/paid`)).json(),
    ).toMatchObject({ purchaseConfirmationPending: true, canSkip: false });
    class Offline extends LocalEmailDeliveryProvider {
      async sendPurchaseConfirmation(
        _input: PurchaseReceipt,
      ): Promise<{ messageId: string }> {
        throw Error("Offline");
      }
    }
    await deliverCommerceNotifications(repository.commerce, new Offline());
    expect(await jobs.claim()).toBeNull();
    now += 61_000;
    const email = new LocalEmailDeliveryProvider();
    await deliverCommerceNotifications(repository.commerce, email);
    expect(await repository.commerce.purchaseConfirmed(purchase.id)).toBe(true);
    expect((await jobs.claim())?.attempts).toBe(1);
  });

  test("automatically retries a failed withdrawal receipt without another user request", async () => {
    let now = Date.now();
    const repository = new InMemoryAssessmentRepository(() => now);
    const input = {
      requestId: crypto.randomUUID(),
      name: "Example",
      email: "customer@example.com",
      contractReference: "Full Compass",
      locale: "de" as const,
    };
    class Offline extends LocalEmailDeliveryProvider {
      async sendWithdrawalConfirmation(): Promise<{ messageId: string }> {
        throw Error("Offline");
      }
    }
    const app = createApp({ repository, emailProvider: new Offline() });
    const response = await app.request("/withdrawals", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const first = await response.json();
    expect(first.confirmationSent).toBe(false);
    now += 61_000;
    const recovered = new LocalEmailDeliveryProvider();
    await deliverCommerceNotifications(repository.commerce, recovered);
    expect(recovered.withdrawals[0]).toMatchObject({
      ...input,
      receivedAt: first.receivedAt,
    });
    expect(
      await repository.commerce.notificationSent(
        "withdrawal_confirmation",
        input.requestId,
      ),
    ).toBe(true);
  });

  test("fences expired mail workers and stops retries before the provider's idempotency window ends", async () => {
    let now = Date.now();
    const repository = new InMemoryAssessmentRepository(() => now);
    await paid(repository);
    const old = await repository.commerce.claimNotification();
    if (!old) throw Error("Missing notification");
    expect(await repository.commerce.claimNotification()).toBeNull();
    now += 301_000;
    const current = await repository.commerce.claimNotification();
    if (!current) throw Error("Missing reclaimed notification");
    expect(await repository.commerce.completeNotification(old, "stale")).toBe(
      false,
    );
    await repository.commerce.failNotification(current);
    now += 24 * 3600_000;
    expect(
      await repository.commerce.claimNotification(current.referenceId, true),
    ).toBeNull();
  });

  test("only full refunds revoke access; out-of-order, repeated and disputed payments cannot regrant it", async () => {
    const repository = new InMemoryAssessmentRepository();
    const { record, purchase, checkout } = await paid(repository);
    const refund: PaymentAdjustment = {
      id: "evt_refund_partial",
      type: "charge.refunded",
      paymentIntentId: purchase.paymentIntentId,
      amount: 1900,
      amountRefunded: 500,
      currency: "eur",
    };
    await repository.commerce.recordAdjustment(refund);
    expect(
      (await repository.getSession(record.session.id))?.entitlements,
    ).toContain("full_analysis");
    await repository.commerce.recordAdjustment({
      id: "evt_dispute_created",
      type: "charge.dispute.created",
      paymentIntentId: purchase.paymentIntentId,
      amount: 1900,
      currency: "eur",
      status: "needs_response",
    });
    expect(
      (await repository.getSession(record.session.id))?.entitlements,
    ).toContain("full_analysis");
    await repository.commerce.recordAdjustment({
      ...refund,
      id: "evt_refund_full",
      amountRefunded: 1900,
    });
    await repository.commerce.recordAdjustment(refund);
    await repository.markPurchasePaid({
      checkoutSessionId: checkout.id,
      paymentIntentId: purchase.paymentIntentId,
      recipientEmail: "customer@example.com",
      currency: "eur",
      amountTotal: 1900,
      consentRecordedAt: purchase.consentRecordedAt,
    });
    expect(
      (await repository.getSession(record.session.id))?.entitlements,
    ).toEqual(["assessment"]);
    const pi = `pi_${crypto.randomUUID()}`;
    await repository.commerce.recordAdjustment({
      ...refund,
      id: "evt_refund_before_checkout",
      paymentIntentId: pi,
      amountRefunded: 1900,
    });
    const later = await paid(repository, pi);
    expect(later.purchase.status).toBe("refunded");
    expect(
      (await repository.getSession(later.record.session.id))?.entitlements,
    ).toEqual(["assessment"]);
  });
});
