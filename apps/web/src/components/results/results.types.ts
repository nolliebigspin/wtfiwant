import type {
  ActionPlanInput,
  AnalysisResponse,
  SessionView,
} from "@wtfiwant/shared";

export interface ResultsClient {
  getSession(id: string): Promise<SessionView>;
  analyze(id: string): Promise<AnalysisResponse>;
  saveActionPlan(id: string, input: ActionPlanInput): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

export type EvidenceAnswers = Record<string, unknown>;
