import {
  type PaymentAdjustment,
  type PurchaseReceipt,
  purchaseReceiptSchema,
  type WithdrawalReceipt,
} from "@wtfiwant/shared";
import type {
  CommerceRecords,
  NotificationJob,
  NotificationKind,
} from "./records";

type Pending = Omit<NotificationJob, "leaseToken"> & {
  status: "pending" | "sending" | "sent" | "failed";
  leaseToken: string;
  leaseUntil: number;
  firstAttempt: number | null;
  nextAttempt: number;
};

export class InMemoryCommerceRecords implements CommerceRecords {
  private readonly purchases = new Map<string, PurchaseReceipt>();
  private readonly notifications = new Map<string, Pending>();
  private readonly adjustments = new Set<string>();
  private readonly refunded = new Map<string, number>();
  private readonly unmatched = new Map<
    string,
    { event: PaymentAdjustment; at: number }
  >();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly revoke: (purchaseId: string) => void = () => {},
  ) {}
  async recordAdjustment(event: PaymentAdjustment) {
    const purchase = [...this.purchases.values()].find(
      (item) =>
        event.paymentIntentId && item.paymentIntentId === event.paymentIntentId,
    );
    if (this.adjustments.has(event.id) || !event.paymentIntentId) return;
    if (!purchase) {
      if (!this.unmatched.has(event.id))
        this.unmatched.set(event.id, {
          event: structuredClone(event),
          at: this.now(),
        });
      return;
    }
    if (event.currency !== purchase.currency)
      throw new Error("Payment adjustment currency mismatch");
    this.adjustments.add(event.id);
    this.unmatched.delete(event.id);
    if (event.type === "charge.refunded") {
      const amount = Math.max(
        this.refunded.get(purchase.purchaseId) ?? 0,
        event.amountRefunded,
      );
      this.refunded.set(purchase.purchaseId, amount);
      if (
        purchase.amountTotal !== null &&
        purchase.amountTotal > 0 &&
        amount >= purchase.amountTotal
      )
        this.revoke(purchase.purchaseId);
    }
  }
  async pruneUnmatchedAdjustments() {
    for (const [id, value] of this.unmatched)
      if (this.now() - value.at > 7 * 86400_000) this.unmatched.delete(id);
  }
  private queue(
    kind: NotificationKind,
    referenceId: string,
    receipt: Pending["receipt"],
  ) {
    const key = `${kind}/${referenceId}`;
    if (!this.notifications.has(key))
      this.notifications.set(key, {
        id: crypto.randomUUID(),
        kind,
        referenceId,
        receipt: structuredClone(receipt),
        status: "pending",
        attempts: 0,
        leaseToken: "",
        leaseUntil: 0,
        firstAttempt: null,
        nextAttempt: this.now(),
      });
  }
  async archivePurchase(input: PurchaseReceipt) {
    const receipt = purchaseReceiptSchema.parse(input);
    if (this.purchases.has(receipt.checkoutSessionId)) return;
    this.purchases.set(receipt.checkoutSessionId, structuredClone(receipt));
    await this.pruneUnmatchedAdjustments();
    for (const pending of [...this.unmatched.values()])
      if (pending.event.paymentIntentId === receipt.paymentIntentId)
        await this.recordAdjustment(pending.event);
    if (receipt.agreement?.confirmationBeforeAI)
      this.queue("purchase_confirmation", receipt.purchaseId, receipt);
  }
  async getPurchase(checkoutId: string) {
    return structuredClone(this.purchases.get(checkoutId) ?? null);
  }
  async purchaseConfirmed(purchaseId: string) {
    const receipt = [...this.purchases.values()].find(
      (r) => r.purchaseId === purchaseId,
    );
    return (
      !receipt?.agreement?.confirmationBeforeAI ||
      this.notificationSent("purchase_confirmation", purchaseId)
    );
  }
  async queueWithdrawal(receipt: WithdrawalReceipt) {
    this.queue("withdrawal_confirmation", receipt.requestId, receipt);
  }
  async notificationSent(kind: NotificationKind, referenceId: string) {
    return this.notifications.get(`${kind}/${referenceId}`)?.status === "sent";
  }
  async claimNotification(referenceId?: string, force = false) {
    for (const job of this.notifications.values()) {
      if (
        (job.status !== "sending" || job.leaseUntil <= this.now()) &&
        (job.attempts >= 8 ||
          (job.firstAttempt !== null &&
            this.now() - job.firstAttempt >= 23 * 3600_000))
      ) {
        if (job.status !== "sent") job.status = "failed";
      }
      if (referenceId && job.referenceId !== referenceId) continue;
      if (
        (job.status === "pending" &&
          (force || job.nextAttempt <= this.now())) ||
        (job.status === "sending" && job.leaseUntil <= this.now())
      ) {
        job.status = "sending";
        job.attempts++;
        job.firstAttempt ??= this.now();
        job.leaseToken = crypto.randomUUID();
        job.leaseUntil = this.now() + 300_000;
        return structuredClone(job);
      }
    }
    return null;
  }
  async completeNotification(input: NotificationJob, _messageId: string) {
    const job = this.notifications.get(`${input.kind}/${input.referenceId}`);
    if (
      !job ||
      job.status !== "sending" ||
      job.leaseToken !== input.leaseToken ||
      job.leaseUntil <= this.now()
    )
      return false;
    job.status = "sent";
    return true;
  }
  async failNotification(input: NotificationJob) {
    const job = this.notifications.get(`${input.kind}/${input.referenceId}`);
    if (!job || job.leaseToken !== input.leaseToken || job.status !== "sending")
      return;
    job.status = job.attempts >= 8 ? "failed" : "pending";
    job.nextAttempt = this.now() + 60_000 * 2 ** (job.attempts - 1);
  }
}
