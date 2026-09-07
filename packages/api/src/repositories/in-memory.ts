import {
  type ActionPlanInput,
  assessmentQuestions,
  type ChapterId,
  type DigitalPurchaseAgreement,
  type Session,
  type StoredAnalysis,
  type WithdrawalInput,
  type WithdrawalReceipt,
} from "@wtfiwant/shared";
import type {
  AssessmentRecord,
  AssessmentRepository,
  NewCoachPrompt,
  NewFollowUp,
  ReportPurchase,
} from "./types";

function copy<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryAssessmentRepository implements AssessmentRepository {
  private readonly sessions = new Map<string, AssessmentRecord>();
  private readonly purchases = new Map<string, ReportPurchase>();
  private readonly withdrawals = new Map<string, WithdrawalReceipt>();
  private readonly webhookEvents = new Map<
    string,
    { status: "processing" | "processed"; updatedAt: number }
  >();
  private readonly deliveries = new Map<
    string,
    {
      id: string;
      status: "pending" | "sent" | "failed";
      attemptCount: number;
      updatedAt: number;
    }
  >();

  constructor(private readonly now: () => number = Date.now) {}

  async createSession(): Promise<AssessmentRecord> {
    const now = new Date().toISOString();
    const first = assessmentQuestions[0];
    const view: AssessmentRecord = {
      session: {
        id: crypto.randomUUID(),
        status: "in_progress",
        currentChapter: first.chapter,
        currentQuestionId: first.id,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      },
      answers: {},
      followUps: [],
      coachPrompts: [],
      analysis: null,
      actionPlan: null,
      entitlements: ["assessment"],
    };
    this.sessions.set(view.session.id, view);
    return copy(view);
  }

  async getSession(id: string): Promise<AssessmentRecord | null> {
    const view = this.sessions.get(id);
    if (!view) return null;
    const purchase = this.purchases.get(id);
    view.entitlements =
      purchase?.status === "paid" && view.session.status !== "safety_paused"
        ? ["assessment", "full_analysis"]
        : ["assessment"];
    return copy(view);
  }

  async updateProgress(
    id: string,
    chapter: ChapterId,
    questionId: string,
  ): Promise<Session | null> {
    const view = this.sessions.get(id);
    if (!view) return null;
    view.session.currentChapter = chapter;
    view.session.currentQuestionId = questionId;
    view.session.updatedAt = new Date().toISOString();
    return copy(view.session);
  }

  async saveAnswer(
    id: string,
    questionId: string,
    value: unknown,
  ): Promise<boolean> {
    const view = this.sessions.get(id);
    if (!view) return false;
    view.answers[questionId] = copy(
      value,
    ) as AssessmentRecord["answers"][string];
    view.session.updatedAt = new Date().toISOString();
    return true;
  }

  async saveFollowUp(id: string, followUp: NewFollowUp): Promise<boolean> {
    const view = this.sessions.get(id);
    if (!view) return false;
    view.followUps.push(
      copy({
        id: followUp.id,
        questionId: followUp.questionId,
        generatedQuestion: followUp.generatedQuestion,
        locale: followUp.locale,
        userResponse: followUp.userResponse,
        createdAt: followUp.createdAt,
      }),
    );
    return true;
  }

  async saveFollowUpResponse(
    id: string,
    followUpId: string,
    response: string,
  ): Promise<boolean> {
    const followUp = this.sessions
      .get(id)
      ?.followUps.find((item) => item.id === followUpId);
    if (!followUp) return false;
    followUp.userResponse = response;
    return true;
  }

  async saveCoachPrompt(id: string, prompt: NewCoachPrompt): Promise<boolean> {
    const view = this.sessions.get(id);
    if (!view) return false;
    view.coachPrompts.push(copy(prompt));
    return true;
  }

  async resolveCoachPrompt(
    id: string,
    promptId: string,
    response: string | null,
  ): Promise<boolean> {
    const prompt = this.sessions
      .get(id)
      ?.coachPrompts.find((candidate) => candidate.id === promptId);
    if (!prompt) return false;
    prompt.userResponse = response;
    prompt.resolvedAt = new Date().toISOString();
    return true;
  }

  async getPurchaseForSession(id: string): Promise<ReportPurchase | null> {
    const purchase = this.purchases.get(id);
    return purchase ? copy(purchase) : null;
  }

  async getPurchaseByCheckout(
    checkoutSessionId: string,
  ): Promise<ReportPurchase | null> {
    const purchase = [...this.purchases.values()].find(
      (candidate) => candidate.checkoutSessionId === checkoutSessionId,
    );
    return purchase ? copy(purchase) : null;
  }

  async saveCheckout(
    sessionId: string,
    checkout: { id: string; url: string },
    agreement?: DigitalPurchaseAgreement,
  ): Promise<ReportPurchase> {
    const existing = this.purchases.get(sessionId);
    const purchase: ReportPurchase = {
      id: existing?.id ?? crypto.randomUUID(),
      sessionId,
      status: "checkout_open",
      checkoutSessionId: checkout.id,
      checkoutUrl: checkout.url,
      paymentIntentId: null,
      recipientEmail: null,
      currency: null,
      amountTotal: null,
      paidAt: null,
      agreement: agreement ? copy(agreement) : null,
      consentRecordedAt: null,
    };
    this.purchases.set(sessionId, purchase);
    return copy(purchase);
  }

  async markPurchasePaid(input: {
    checkoutSessionId: string;
    paymentIntentId: string | null;
    recipientEmail: string;
    currency: string | null;
    amountTotal: number | null;
    consentRecordedAt: string | null;
  }): Promise<ReportPurchase | null> {
    const purchase = [...this.purchases.values()].find(
      (candidate) => candidate.checkoutSessionId === input.checkoutSessionId,
    );
    if (!purchase) return null;
    purchase.status = "paid";
    purchase.paymentIntentId = input.paymentIntentId;
    purchase.recipientEmail = input.recipientEmail;
    purchase.currency = input.currency;
    purchase.amountTotal = input.amountTotal;
    purchase.paidAt ??= new Date().toISOString();
    purchase.consentRecordedAt ??= input.consentRecordedAt;
    return copy(purchase);
  }

  async saveWithdrawal(input: WithdrawalInput): Promise<WithdrawalReceipt> {
    const existing = this.withdrawals.get(input.requestId);
    if (existing) {
      if (
        existing.name !== input.name ||
        existing.email !== input.email ||
        existing.contractReference !== input.contractReference ||
        existing.locale !== input.locale
      )
        throw new Error("Withdrawal request ID already used");
      return copy(existing);
    }
    const receipt = {
      ...input,
      receivedAt: new Date(this.now()).toISOString(),
    };
    this.withdrawals.set(input.requestId, receipt);
    return copy(receipt);
  }

  async markWithdrawalConfirmationSent(_requestId: string): Promise<void> {}

  async setPurchaseStatusByCheckout(
    checkoutSessionId: string,
    status: "failed" | "expired",
  ): Promise<boolean> {
    const purchase = [...this.purchases.values()].find(
      (candidate) => candidate.checkoutSessionId === checkoutSessionId,
    );
    if (!purchase || purchase.status === "paid") return false;
    purchase.status = status;
    return true;
  }

  async claimWebhookEvent(provider: string, eventId: string): Promise<boolean> {
    const key = `${provider}:${eventId}`;
    const existing = this.webhookEvents.get(key);
    if (
      existing &&
      (existing.status === "processed" ||
        this.now() - existing.updatedAt < 300_000)
    )
      return false;
    this.webhookEvents.set(key, {
      status: "processing",
      updatedAt: this.now(),
    });
    return true;
  }

  async completeWebhookEvent(provider: string, eventId: string): Promise<void> {
    this.webhookEvents.set(`${provider}:${eventId}`, {
      status: "processed",
      updatedAt: this.now(),
    });
  }

  async releaseWebhookEvent(provider: string, eventId: string): Promise<void> {
    const key = `${provider}:${eventId}`;
    if (this.webhookEvents.get(key)?.status === "processing")
      this.webhookEvents.delete(key);
  }

  async claimInitialDelivery(purchaseId: string): Promise<string | null> {
    const existing = this.deliveries.get(purchaseId);
    if (existing) {
      const retryable =
        (existing.status === "pending" &&
          this.now() - existing.updatedAt >= 300_000) ||
        (existing.status === "failed" &&
          this.now() - existing.updatedAt >= 60_000);
      if (!retryable || existing.attemptCount >= 5) return null;
      existing.status = "pending";
      existing.attemptCount += 1;
      existing.updatedAt = this.now();
      return existing.id;
    }
    const id = crypto.randomUUID();
    this.deliveries.set(purchaseId, {
      id,
      status: "pending",
      attemptCount: 1,
      updatedAt: this.now(),
    });
    return id;
  }

  async prepareDeliveryRetry(
    purchaseId: string,
  ): Promise<{ deliveryId: string; attemptCount: number } | null> {
    const delivery = this.deliveries.get(purchaseId);
    if (
      !delivery ||
      delivery.attemptCount >= 5 ||
      this.now() - delivery.updatedAt < 60_000
    )
      return null;
    delivery.attemptCount += 1;
    delivery.status = "pending";
    delivery.updatedAt = this.now();
    return { deliveryId: delivery.id, attemptCount: delivery.attemptCount };
  }

  async markDeliverySent(deliveryId: string): Promise<void> {
    const delivery = [...this.deliveries.values()].find(
      (candidate) => candidate.id === deliveryId,
    );
    if (delivery) {
      delivery.status = "sent";
      delivery.updatedAt = this.now();
    }
  }

  async markDeliveryFailed(
    deliveryId: string,
    _errorCode: string,
  ): Promise<void> {
    const delivery = [...this.deliveries.values()].find(
      (candidate) => candidate.id === deliveryId,
    );
    if (delivery) {
      delivery.status = "failed";
      delivery.updatedAt = this.now();
    }
  }

  async saveAnalysis(id: string, analysis: StoredAnalysis): Promise<boolean> {
    const view = this.sessions.get(id);
    if (!view) return false;
    view.analysis = copy(analysis);
    view.session.status = "completed";
    view.session.completedAt = new Date().toISOString();
    view.session.updatedAt = view.session.completedAt;
    return true;
  }

  async setStatus(id: string, status: Session["status"]): Promise<boolean> {
    const view = this.sessions.get(id);
    if (!view) return false;
    view.session.status = status;
    view.session.updatedAt = new Date().toISOString();
    return true;
  }

  async saveActionPlan(id: string, input: ActionPlanInput): Promise<boolean> {
    const view = this.sessions.get(id);
    if (!view) return false;
    view.actionPlan = { ...copy(input), updatedAt: new Date().toISOString() };
    return true;
  }

  async deleteSession(id: string): Promise<boolean> {
    this.purchases.delete(id);
    return this.sessions.delete(id);
  }
}
