import type { Locale, StoredAnalysis } from "@wtfiwant/shared";

export type FullCompassEmail = {
  to: string;
  locale: Locale;
  analysis: StoredAnalysis;
  evidence: Record<string, unknown>;
  resultUrl: string;
  idempotencyKey: string;
};

export interface EmailDeliveryProvider {
  sendFullCompass(input: FullCompassEmail): Promise<{ messageId: string }>;
}
