import {
  type ActionPlanInput,
  type AnalysisResponse,
  actionPlanSchema,
  analysisResponseSchema,
  type ChapterId,
  type CheckoutResponse,
  type CompassResponse,
  checkoutResponseSchema,
  coachPromptResponseSchema,
  compassResponseSchema,
  type FulfillmentStatus,
  fulfillmentResponseSchema,
  type Locale,
  type SessionView,
  sessionViewSchema,
} from "@wtfiwant/shared";

// The API runs in-process as Next route handlers, so requests stay same-origin.
const API_BASE = "/api";

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export interface ReflectionClient {
  getSession(id: string): Promise<SessionView>;
  saveAnswer(id: string, questionId: string, value: unknown): Promise<void>;
  updateProgress(
    id: string,
    chapter: ChapterId,
    questionId: string,
  ): Promise<void>;
  createCoachPrompt(
    id: string,
    chapter: ChapterId,
    locale?: Locale,
  ): Promise<{
    id: string;
    question: string;
    userResponse: string | null;
    resolvedAt: string | null;
  }>;
  resolveCoachPrompt(
    id: string,
    promptId: string,
    response: string | null,
  ): Promise<void>;
}

export const api: ReflectionClient & {
  createSession(): Promise<SessionView>;
  analyze(id: string, locale?: Locale): Promise<AnalysisResponse>;
  getCompass(id: string): Promise<CompassResponse>;
  createCheckout(id: string, locale?: Locale): Promise<CheckoutResponse>;
  fulfillCheckout(checkoutSessionId: string): Promise<FulfillmentStatus>;
  resendFullCompass(id: string): Promise<void>;
  saveActionPlan(id: string, input: ActionPlanInput): Promise<void>;
  deleteSession(id: string): Promise<void>;
  seed(persona: string): Promise<SessionView>;
} = {
  async createSession() {
    return sessionViewSchema.parse(
      await request("/sessions", { method: "POST" }),
    );
  },
  async getSession(id) {
    return sessionViewSchema.parse(await request(`/sessions/${id}`));
  },
  async saveAnswer(id, questionId, value) {
    await request(`/sessions/${id}/answers/${encodeURIComponent(questionId)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },
  async updateProgress(id, currentChapter, currentQuestionId) {
    await request(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ currentChapter, currentQuestionId }),
    });
  },
  async createCoachPrompt(id, chapter, locale = "en") {
    const body = coachPromptResponseSchema.parse(
      await request(`/sessions/${id}/coach-prompt`, {
        method: "POST",
        body: JSON.stringify({ chapter, locale }),
      }),
    );
    const prompt = body.coachPrompt;
    return {
      id: prompt.id,
      question: prompt.question,
      userResponse: prompt.userResponse,
      resolvedAt: prompt.resolvedAt,
    };
  },
  async resolveCoachPrompt(id, promptId, response) {
    await request(`/sessions/${id}/coach-prompt/${promptId}`, {
      method: "PUT",
      body: JSON.stringify({ response }),
    });
  },
  async analyze(id, locale = "en") {
    return analysisResponseSchema.parse(
      await request(`/sessions/${id}/analyze`, {
        method: "POST",
        body: JSON.stringify({ locale }),
      }),
    );
  },
  async getCompass(id) {
    return compassResponseSchema.parse(
      await request(`/sessions/${id}/compass`),
    );
  },
  async createCheckout(id, locale = "en") {
    return checkoutResponseSchema.parse(
      await request(`/sessions/${id}/checkout`, {
        method: "POST",
        body: JSON.stringify({ locale }),
      }),
    );
  },
  async fulfillCheckout(checkoutSessionId) {
    const body = fulfillmentResponseSchema.parse(
      await request(`/checkout/${checkoutSessionId}/fulfill`, {
        method: "POST",
      }),
    );
    return body.status;
  },
  async resendFullCompass(id) {
    await request(`/sessions/${id}/report-email`, { method: "POST" });
  },
  async saveActionPlan(id, input) {
    const body = (await request(`/sessions/${id}/action-plan`, {
      method: "PUT",
      body: JSON.stringify(input),
    })) as { actionPlan: unknown };
    actionPlanSchema.parse(body.actionPlan);
  },
  async deleteSession(id) {
    await request(`/sessions/${id}`, { method: "DELETE" });
  },
  async seed(persona) {
    return sessionViewSchema.parse(
      await request(`/dev/seed/${persona}`, { method: "POST" }),
    );
  },
};
