import {
  type ActionPlanInput,
  assessmentQuestions,
  type ChapterId,
  type Session,
  type StoredAnalysis,
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
  private readonly webhookEvents = new Set<string>();
  private readonly deliveries = new Map<
    string,
    {
      id: string;
      status: "pending" | "sent" | "failed";
      attemptCount: number;
    }
  >();

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
      purchase?.status === "paid"
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

  async saveCheckout(
    sessionId: string,
    checkout: { id: string; url: string },
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
    return copy(purchase);
  }

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
    if (this.webhookEvents.has(key)) return false;
    this.webhookEvents.add(key);
    return true;
  }

  async claimInitialDelivery(purchaseId: string): Promise<string | null> {
    if (this.deliveries.has(purchaseId)) return null;
    const id = crypto.randomUUID();
    this.deliveries.set(purchaseId, {
      id,
      status: "pending",
      attemptCount: 1,
    });
    return id;
  }

  async prepareDeliveryRetry(
    purchaseId: string,
  ): Promise<{ deliveryId: string; attemptCount: number } | null> {
    const delivery = this.deliveries.get(purchaseId);
    if (!delivery || delivery.attemptCount >= 5) return null;
    delivery.attemptCount += 1;
    delivery.status = "pending";
    return { deliveryId: delivery.id, attemptCount: delivery.attemptCount };
  }

  async markDeliverySent(deliveryId: string): Promise<void> {
    const delivery = [...this.deliveries.values()].find(
      (candidate) => candidate.id === deliveryId,
    );
    if (delivery) delivery.status = "sent";
  }

  async markDeliveryFailed(
    deliveryId: string,
    _errorCode: string,
  ): Promise<void> {
    const delivery = [...this.deliveries.values()].find(
      (candidate) => candidate.id === deliveryId,
    );
    if (delivery) delivery.status = "failed";
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
