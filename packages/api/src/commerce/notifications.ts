import {
  purchaseReceiptSchema,
  withdrawalReceiptSchema,
} from "@wtfiwant/shared";
import type { EmailDeliveryProvider } from "../email/provider";
import type { CommerceRecords } from "./records";

/** Retries stay inside Resend's 24h idempotency window; leases fence workers. */
export async function deliverCommerceNotifications(
  records: CommerceRecords,
  provider?: EmailDeliveryProvider,
  referenceId?: string,
) {
  if (!provider) return;
  for (let index = 0; index < (referenceId ? 1 : 10); index++) {
    const job = await records.claimNotification(
      referenceId,
      Boolean(referenceId),
    );
    if (!job) return;
    try {
      const sent =
        job.kind === "purchase_confirmation"
          ? await provider.sendPurchaseConfirmation(
              purchaseReceiptSchema.parse(job.receipt),
            )
          : await provider.sendWithdrawalConfirmation(
              withdrawalReceiptSchema.parse(job.receipt),
            );
      await records.completeNotification(job, sent.messageId);
    } catch {
      await records.failNotification(job);
      // No recipient, reference, declaration, provider body or credentials.
      console.error("Commerce confirmation delivery pending", {
        kind: job.kind,
        attempt: job.attempts,
      });
    }
  }
}
