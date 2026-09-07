import type { WithdrawalReceipt } from "@wtfiwant/shared";
import type { EmailDeliveryProvider, FullCompassEmail } from "./provider";

/** Development-only capture adapter. It never sends or logs private content. */
export class LocalEmailDeliveryProvider implements EmailDeliveryProvider {
  readonly sent: FullCompassEmail[] = [];
  readonly withdrawals: WithdrawalReceipt[] = [];

  async sendFullCompass(input: FullCompassEmail) {
    this.sent.push(structuredClone(input));
    return { messageId: `local_${crypto.randomUUID()}` };
  }

  async sendWithdrawalConfirmation(input: WithdrawalReceipt) {
    if (!this.withdrawals.some((item) => item.requestId === input.requestId))
      this.withdrawals.push(structuredClone(input));
    return { messageId: `local_withdrawal_${input.requestId}` };
  }
}
