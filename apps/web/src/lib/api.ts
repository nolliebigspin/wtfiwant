import {
  type ActionPlanInput,
  type AnalysisResponse,
  actionPlanSchema,
  analysisResponseSchema,
  type ChapterId,
  followUpSchema,
  type SessionView,
  sessionViewSchema,
} from "@wtfiwant/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
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
  createFollowUp(
    id: string,
    questionId: string,
  ): Promise<{ id: string; generatedQuestion: string }>;
  saveFollowUpResponse(
    id: string,
    followUpId: string,
    response: string,
  ): Promise<void>;
}

export const api: ReflectionClient & {
  createSession(): Promise<SessionView>;
  analyze(id: string): Promise<AnalysisResponse>;
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
  async createFollowUp(id, questionId) {
    const body = (await request(`/sessions/${id}/follow-up`, {
      method: "POST",
      body: JSON.stringify({ questionId }),
    })) as { followUp: unknown };
    const followUp = followUpSchema.parse(body.followUp);
    return { id: followUp.id, generatedQuestion: followUp.generatedQuestion };
  },
  async saveFollowUpResponse(id, followUpId, response) {
    await request(`/sessions/${id}/follow-up/${followUpId}`, {
      method: "PUT",
      body: JSON.stringify({ response }),
    });
  },
  async analyze(id) {
    return analysisResponseSchema.parse(
      await request(`/sessions/${id}/analyze`, { method: "POST" }),
    );
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
