import {
  type PaymentAdjustment,
  type PurchaseReceipt,
  purchaseReceiptSchema,
  type WithdrawalReceipt,
} from "@wtfiwant/shared";
import type { ReportPurchase } from "../repositories/types";

export type NotificationKind =
  | "purchase_confirmation"
  | "withdrawal_confirmation";
export type NotificationJob = {
  id: string;
  kind: NotificationKind;
  referenceId: string;
  leaseToken: string;
  attempts: number;
  receipt: PurchaseReceipt | WithdrawalReceipt;
};
export interface CommerceRecords {
  recordAdjustment(event: PaymentAdjustment): Promise<void>;
  pruneUnmatchedAdjustments(): Promise<void>;
  archivePurchase(receipt: PurchaseReceipt): Promise<void>;
  getPurchase(checkoutId: string): Promise<PurchaseReceipt | null>;
  purchaseConfirmed(purchaseId: string): Promise<boolean>;
  queueWithdrawal(receipt: WithdrawalReceipt): Promise<void>;
  notificationSent(
    kind: NotificationKind,
    referenceId: string,
  ): Promise<boolean>;
  claimNotification(
    referenceId?: string,
    force?: boolean,
  ): Promise<NotificationJob | null>;
  completeNotification(
    job: NotificationJob,
    messageId: string,
  ): Promise<boolean>;
  failNotification(job: NotificationJob): Promise<void>;
}

export function legalReceipt(purchase: ReportPurchase): PurchaseReceipt {
  return purchaseReceiptSchema.parse({
    purchaseId: purchase.id,
    checkoutSessionId: purchase.checkoutSessionId,
    paymentIntentId: purchase.paymentIntentId,
    recipientEmail: purchase.recipientEmail,
    amountTotal: purchase.amountTotal,
    currency: purchase.currency,
    paidAt: purchase.paidAt,
    agreement: purchase.agreement,
    consentRecordedAt: purchase.consentRecordedAt,
  });
}
