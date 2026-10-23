import type {
  ActionPlanInput,
  Locale,
  PurchaseReceipt,
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
  actionPlan?: ActionPlanInput | null;
};

export interface EmailDeliveryProvider {
  sendPurchaseConfirmation(
    input: PurchaseReceipt,
  ): Promise<{ messageId: string }>;
  sendFullCompass(input: FullCompassEmail): Promise<{ messageId: string }>;
  sendWithdrawalConfirmation(
    input: WithdrawalReceipt,
  ): Promise<{ messageId: string }>;
}
