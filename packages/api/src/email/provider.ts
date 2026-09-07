import type {
  Locale,
  StoredAnalysis,
  WithdrawalReceipt,
} from "@wtfiwant/shared";
import type { ReportPurchase } from "../repositories/types";

export type FullCompassEmail = {
  to: string;
  locale: Locale;
  analysis: StoredAnalysis;
  evidence: Record<string, unknown>;
  resultUrl: string;
  idempotencyKey: string;
  purchase?: ReportPurchase;
};

export interface EmailDeliveryProvider {
  sendFullCompass(input: FullCompassEmail): Promise<{ messageId: string }>;
  sendWithdrawalConfirmation(
    input: WithdrawalReceipt,
  ): Promise<{ messageId: string }>;
}
