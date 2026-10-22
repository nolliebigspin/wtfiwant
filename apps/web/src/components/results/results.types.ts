import type {
  ActionPlanInput,
  AnalysisResponse,
  CheckoutResponse,
  Checkpoint,
  CompassResponse,
  DirectionReview,
  FulfillmentStatus,
  Locale,
  PaidJourney,
  SessionView,
} from "@wtfiwant/shared";

export interface ResultsClient {
  getCheckpoint(
    id: string,
    locale: Locale,
  ): Promise<
    | { checkpoint: Checkpoint; status?: undefined }
    | { status: "safety_paused"; message: string }
  >;
  startPaidJourney(id: string): Promise<PaidJourney>;
  getPaidJourney(id: string): Promise<PaidJourney>;
  saveRefinement(
    id: string,
    questionId: string,
    response: string | null,
  ): Promise<void>;
  synthesizeDirection(id: string): Promise<PaidJourney>;
  generateReport(id: string, review: DirectionReview): Promise<PaidJourney>;
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
