import type { Locale, StoredAnalysis } from "@wtfiwant/shared";

export type FullCompassEmail = {
  to: string;
  locale: Locale;
  analysis: StoredAnalysis;
  resultUrl: string;
  idempotencyKey: string;
};

export interface EmailDeliveryProvider {
  sendFullCompass(input: FullCompassEmail): Promise<{ messageId: string }>;
}
