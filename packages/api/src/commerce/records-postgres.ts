import {
  type PaymentAdjustment,
  type PurchaseReceipt,
  paymentAdjustmentSchema,
  purchaseReceiptSchema,
  type WithdrawalReceipt,
  withdrawalReceiptSchema,
} from "@wtfiwant/shared";
import type { Sql } from "postgres";
import type {
  CommerceRecords,
  NotificationJob,
  NotificationKind,
} from "./records";

export class PostgresCommerceRecords implements CommerceRecords {
  constructor(private readonly sql: Sql) {}
  async recordAdjustment(event: PaymentAdjustment) {
    if (!event.paymentIntentId) return;
    await this.sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${event.paymentIntentId}, 9182))`;
      await this.applyAdjustment(tx as unknown as Sql, event);
    });
  }
  private async applyAdjustment(tx: Sql, event: PaymentAdjustment) {
    const [record] =
      await tx`SELECT * FROM purchase_legal_records WHERE stripe_payment_intent_id = ${event.paymentIntentId} FOR UPDATE`;
    if (!record) {
      await tx`INSERT INTO unmatched_payment_adjustments(event_id, stripe_payment_intent_id, event)
          VALUES (${event.id}, ${event.paymentIntentId}, ${tx.json(event)}) ON CONFLICT(event_id) DO NOTHING`;
      return;
    }
    const receipt = purchaseReceiptSchema.parse(record.receipt);
    if (event.currency !== receipt.currency)
      throw new Error("Payment adjustment currency mismatch");
    const inserted =
      await tx`INSERT INTO payment_adjustments(event_id, purchase_id, event_type, amount, currency, provider_status)
        VALUES (${event.id}, ${receipt.purchaseId}, ${event.type}, ${event.type === "charge.refunded" ? event.amountRefunded : event.amount},
          ${event.currency}, ${event.type === "charge.refunded" ? "refunded" : event.status}) ON CONFLICT(event_id) DO NOTHING RETURNING event_id`;
    await tx`DELETE FROM unmatched_payment_adjustments WHERE event_id = ${event.id}`;
    if (!inserted.length || event.type !== "charge.refunded") return;
    const [updated] =
      await tx`UPDATE purchase_legal_records SET refunded_amount = GREATEST(refunded_amount, ${event.amountRefunded})
        WHERE purchase_id = ${receipt.purchaseId} RETURNING refunded_amount`;
    if (
      receipt.amountTotal !== null &&
      receipt.amountTotal > 0 &&
      updated.refunded_amount >= receipt.amountTotal
    ) {
      const [purchase] =
        await tx`UPDATE report_purchases SET status = 'refunded', updated_at = now() WHERE id = ${receipt.purchaseId} RETURNING session_id`;
      if (purchase)
        await tx`UPDATE paid_ai_jobs SET status = 'failed', lease_token = NULL
        WHERE session_id = ${purchase.session_id} AND status IN ('queued', 'running')`;
    }
  }
  async pruneUnmatchedAdjustments() {
    await this
      .sql`DELETE FROM unmatched_payment_adjustments WHERE received_at < now() - interval '7 days'`;
  }
  async archivePurchase(input: PurchaseReceipt) {
    const receipt = purchaseReceiptSchema.parse(input);
    await this
      .sql`INSERT INTO purchase_legal_records (purchase_id, stripe_checkout_session_id, stripe_payment_intent_id, receipt)
      VALUES (${receipt.purchaseId}, ${receipt.checkoutSessionId}, ${receipt.paymentIntentId}, ${this.sql.json(receipt)})
      ON CONFLICT (stripe_checkout_session_id) DO NOTHING`;
    const pending = await this
      .sql`SELECT event FROM unmatched_payment_adjustments WHERE stripe_payment_intent_id = ${receipt.paymentIntentId}
      AND received_at > now() - interval '7 days' ORDER BY received_at`;
    for (const row of pending)
      await this.applyAdjustment(
        this.sql,
        paymentAdjustmentSchema.parse(row.event),
      );
    await this.sql`INSERT INTO commerce_notifications(kind, reference_id)
      SELECT 'purchase_confirmation', purchase_id FROM purchase_legal_records
      WHERE purchase_id = ${receipt.purchaseId} AND receipt->'agreement'->>'confirmationBeforeAI' = 'true'
      ON CONFLICT(kind, reference_id) DO NOTHING`;
  }
  async getPurchase(checkoutId: string) {
    const [row] = await this
      .sql`SELECT receipt FROM purchase_legal_records WHERE stripe_checkout_session_id = ${checkoutId}`;
    return row ? purchaseReceiptSchema.parse(row.receipt) : null;
  }
  async purchaseConfirmed(purchaseId: string) {
    const [row] = await this
      .sql`SELECT receipt, confirmation_sent_at FROM purchase_legal_records WHERE purchase_id = ${purchaseId}`;
    return (
      !row?.receipt?.agreement?.confirmationBeforeAI ||
      row.confirmation_sent_at !== null
    );
  }
  async queueWithdrawal(receipt: WithdrawalReceipt) {
    await this.sql`INSERT INTO commerce_notifications(kind, reference_id)
      VALUES ('withdrawal_confirmation', ${receipt.requestId}) ON CONFLICT(kind, reference_id) DO NOTHING`;
  }
  async notificationSent(kind: NotificationKind, referenceId: string) {
    const [row] = await this
      .sql`SELECT status FROM commerce_notifications WHERE kind = ${kind} AND reference_id = ${referenceId}`;
    return row?.status === "sent";
  }
  async claimNotification(
    referenceId?: string,
    force = false,
  ): Promise<NotificationJob | null> {
    await this
      .sql`UPDATE commerce_notifications SET status = 'failed', lease_token = NULL
      WHERE status IN ('pending', 'sending') AND (attempts >= 8 OR first_attempt_at <= now() - interval '23 hours')
      AND (status <> 'sending' OR lease_until <= now())`;
    const [row] = await this
      .sql`UPDATE commerce_notifications SET status = 'sending', attempts = attempts + 1,
      first_attempt_at = COALESCE(first_attempt_at, now()), lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes'
      WHERE id = (SELECT id FROM commerce_notifications WHERE
        (${referenceId ?? null}::uuid IS NULL OR reference_id = ${referenceId ?? null}::uuid)
        AND attempts < 8 AND (first_attempt_at IS NULL OR first_attempt_at > now() - interval '23 hours')
        AND ((status = 'pending' AND (${force} OR next_attempt_at <= now())) OR (status = 'sending' AND lease_until <= now()))
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
    if (!row) return null;
    let receipt: PurchaseReceipt | WithdrawalReceipt;
    if (row.kind === "purchase_confirmation") {
      const [source] = await this
        .sql`SELECT receipt FROM purchase_legal_records WHERE purchase_id = ${row.reference_id}`;
      receipt = purchaseReceiptSchema.parse(source?.receipt);
    } else {
      const [source] = await this
        .sql`SELECT * FROM withdrawal_requests WHERE request_id = ${row.reference_id}`;
      receipt = withdrawalReceiptSchema.parse(
        source && {
          requestId: source.request_id,
          name: source.name,
          email: source.email,
          contractReference: source.contract_reference,
          locale: source.locale,
          receivedAt: source.received_at.toISOString(),
        },
      );
    }
    return {
      id: row.id,
      kind: row.kind,
      referenceId: row.reference_id,
      leaseToken: row.lease_token,
      attempts: row.attempts,
      receipt,
    };
  }
  async completeNotification(job: NotificationJob, messageId: string) {
    return this.sql.begin(async (tx) => {
      const rows =
        await tx`UPDATE commerce_notifications SET status = 'sent', sent_at = now(),
        provider_message_id = ${messageId}, lease_token = NULL
        WHERE id = ${job.id} AND status = 'sending' AND lease_token = ${job.leaseToken} AND lease_until > now() RETURNING id`;
      if (!rows.length) return false;
      if (job.kind === "purchase_confirmation")
        await tx`UPDATE purchase_legal_records SET confirmation_sent_at = COALESCE(confirmation_sent_at, now()) WHERE purchase_id = ${job.referenceId}`;
      else
        await tx`UPDATE withdrawal_requests SET confirmation_sent_at = COALESCE(confirmation_sent_at, now()) WHERE request_id = ${job.referenceId}`;
      return true;
    });
  }
  async failNotification(job: NotificationJob) {
    await this
      .sql`UPDATE commerce_notifications SET status = CASE WHEN attempts >= 8 THEN 'failed' ELSE 'pending' END,
      lease_token = NULL, next_attempt_at = now() + (${60 * 2 ** (job.attempts - 1)} * interval '1 second')
      WHERE id = ${job.id} AND status = 'sending' AND lease_token = ${job.leaseToken}`;
  }
}
