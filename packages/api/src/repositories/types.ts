import type {
  ActionPlanInput,
  ChapterId,
  CoachPrompt,
  Locale,
  Session,
  SessionView,
  StoredAnalysis,
} from "@wtfiwant/shared";

export type AssessmentRecord = Omit<
  SessionView,
  "preview" | "checkoutAvailable" | "legalLinks"
> & {
  analysis: StoredAnalysis | null;
};

export type NewFollowUp = {
  id: string;
  questionId: string;
  userAnswer: string;
  generatedQuestion: string;
  locale: Locale;
  userResponse: string | null;
  createdAt: string;
};

export type NewCoachPrompt = CoachPrompt;

export type ReportPurchase = {
  id: string;
  sessionId: string;
  status: "checkout_open" | "paid" | "failed" | "expired" | "refunded";
  checkoutSessionId: string;
  checkoutUrl: string;
  paymentIntentId: string | null;
  recipientEmail: string | null;
  currency: string | null;
  amountTotal: number | null;
  paidAt: string | null;
};

export interface AssessmentRepository {
  createSession(): Promise<AssessmentRecord>;
  getSession(id: string): Promise<AssessmentRecord | null>;
  updateProgress(
    id: string,
    chapter: ChapterId,
    questionId: string,
  ): Promise<Session | null>;
  saveAnswer(id: string, questionId: string, value: unknown): Promise<boolean>;
  saveFollowUp(id: string, followUp: NewFollowUp): Promise<boolean>;
  saveFollowUpResponse(
    id: string,
    followUpId: string,
    response: string,
  ): Promise<boolean>;
  saveCoachPrompt(id: string, prompt: NewCoachPrompt): Promise<boolean>;
  resolveCoachPrompt(
    id: string,
    promptId: string,
    response: string | null,
  ): Promise<boolean>;
  getPurchaseForSession(id: string): Promise<ReportPurchase | null>;
  getPurchaseByCheckout(
    checkoutSessionId: string,
  ): Promise<ReportPurchase | null>;
  saveCheckout(
    sessionId: string,
    checkout: { id: string; url: string },
  ): Promise<ReportPurchase>;
  markPurchasePaid(input: {
    checkoutSessionId: string;
    paymentIntentId: string | null;
    recipientEmail: string;
    currency: string | null;
    amountTotal: number | null;
  }): Promise<ReportPurchase | null>;
  setPurchaseStatusByCheckout(
    checkoutSessionId: string,
    status: "failed" | "expired",
  ): Promise<boolean>;
  claimWebhookEvent(provider: string, eventId: string): Promise<boolean>;
  completeWebhookEvent(provider: string, eventId: string): Promise<void>;
  releaseWebhookEvent(provider: string, eventId: string): Promise<void>;
  claimInitialDelivery(purchaseId: string): Promise<string | null>;
  prepareDeliveryRetry(
    purchaseId: string,
  ): Promise<{ deliveryId: string; attemptCount: number } | null>;
  markDeliverySent(deliveryId: string, messageId: string): Promise<void>;
  markDeliveryFailed(deliveryId: string, errorCode: string): Promise<void>;
  saveAnalysis(id: string, analysis: StoredAnalysis): Promise<boolean>;
  setStatus(id: string, status: Session["status"]): Promise<boolean>;
  saveActionPlan(id: string, input: ActionPlanInput): Promise<boolean>;
  deleteSession(id: string): Promise<boolean>;
}
