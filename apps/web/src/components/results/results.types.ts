import type {
  ActionPlanInput,
  AnalysisResponse,
  CheckoutResponse,
  CompassResponse,
  FulfillmentStatus,
  Locale,
  SessionView,
} from "@wtfiwant/shared";

export interface ResultsClient {
  getSession(id: string): Promise<SessionView>;
  analyze(id: string, locale?: Locale): Promise<AnalysisResponse>;
  getCompass(id: string): Promise<CompassResponse>;
  createCheckout(id: string, locale?: Locale): Promise<CheckoutResponse>;
  fulfillCheckout(checkoutSessionId: string): Promise<FulfillmentStatus>;
  resendFullCompass(id: string): Promise<void>;
  saveActionPlan(id: string, input: ActionPlanInput): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

export type EvidenceAnswers = Record<string, unknown>;
