import type {
  ActionPlanInput,
  ChapterId,
  Locale,
  Session,
  SessionView,
  StoredAnalysis,
} from "@wtfiwant/shared";

export type NewFollowUp = {
  id: string;
  questionId: string;
  userAnswer: string;
  generatedQuestion: string;
  locale: Locale;
  userResponse: string | null;
  createdAt: string;
};

export interface AssessmentRepository {
  createSession(): Promise<SessionView>;
  getSession(id: string): Promise<SessionView | null>;
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
  saveAnalysis(id: string, analysis: StoredAnalysis): Promise<boolean>;
  setStatus(id: string, status: Session["status"]): Promise<boolean>;
  saveActionPlan(id: string, input: ActionPlanInput): Promise<boolean>;
  deleteSession(id: string): Promise<boolean>;
}
