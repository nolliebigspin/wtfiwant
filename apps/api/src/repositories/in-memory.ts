import {
  type ActionPlanInput,
  assessmentQuestions,
  type ChapterId,
  type Session,
  type SessionView,
  type StoredAnalysis,
} from "@wtfiwant/shared";
import type { AssessmentRepository, NewFollowUp } from "./types";

function copy<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryAssessmentRepository implements AssessmentRepository {
  private readonly sessions = new Map<string, SessionView>();

  async createSession(): Promise<SessionView> {
    const now = new Date().toISOString();
    const first = assessmentQuestions[0];
    const view: SessionView = {
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
      analysis: null,
      actionPlan: null,
      entitlements: ["assessment", "full_analysis"],
    };
    this.sessions.set(view.session.id, view);
    return copy(view);
  }

  async getSession(id: string): Promise<SessionView | null> {
    const view = this.sessions.get(id);
    return view ? copy(view) : null;
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
    view.answers[questionId] = copy(value) as SessionView["answers"][string];
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
    return this.sessions.delete(id);
  }
}
