import {
  type ActionPlanInput,
  assessmentQuestions,
  type ChapterId,
  type Session,
  type SessionView,
  type StoredAnalysis,
} from "@wtfiwant/shared";
import postgres, { type Sql } from "postgres";
import type { AssessmentRepository, NewFollowUp } from "./types";

type SessionRow = {
  id: string;
  status: Session["status"];
  current_chapter: ChapterId;
  current_question_id: string;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
};

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    status: row.status,
    currentChapter: row.current_chapter,
    currentQuestionId: row.current_question_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    completedAt: row.completed_at?.toISOString() ?? null,
  };
}

export class PostgresAssessmentRepository implements AssessmentRepository {
  constructor(private readonly sql: Sql) {}

  static connect(databaseUrl: string): PostgresAssessmentRepository {
    return new PostgresAssessmentRepository(postgres(databaseUrl));
  }

  async createSession(): Promise<SessionView> {
    const first = assessmentQuestions[0];
    const [row] = await this.sql<SessionRow[]>`
      INSERT INTO assessment_sessions (status, current_chapter, current_question_id)
      VALUES ('in_progress', ${first.chapter}, ${first.id})
      RETURNING *
    `;
    return {
      session: mapSession(row),
      answers: {},
      followUps: [],
      analysis: null,
      actionPlan: null,
      entitlements: ["assessment", "full_analysis"],
    };
  }

  async getSession(id: string): Promise<SessionView | null> {
    const sessionRows = await this.sql<SessionRow[]>`
      SELECT * FROM assessment_sessions WHERE id = ${id}
    `;
    const row = sessionRows[0];
    if (!row) return null;

    const [answerRows, followUpRows, analysisRows, actionRows] =
      await Promise.all([
        this.sql<
          Array<{ question_id: string; answer: SessionView["answers"][string] }>
        >`
        SELECT question_id, answer FROM assessment_answers WHERE session_id = ${id}
      `,
        this.sql<
          Array<{
            id: string;
            question_id: string;
            generated_question: string;
            user_response: string | null;
            created_at: Date;
          }>
        >`
        SELECT id, question_id, generated_question, user_response, created_at
        FROM ai_followups WHERE session_id = ${id} ORDER BY created_at
      `,
        this.sql<
          Array<{
            version: string;
            model: string;
            result: StoredAnalysis["result"];
            created_at: Date;
          }>
        >`
        SELECT version, model, result, created_at
        FROM assessment_analyses WHERE session_id = ${id} ORDER BY created_at DESC LIMIT 1
      `,
        this.sql<
          Array<{
            direction: string;
            experiment: string;
            immediate_action: string;
            obstacle: string;
            if_condition: string;
            then_action: string;
            updated_at: Date;
          }>
        >`
        SELECT direction, experiment, immediate_action, obstacle, if_condition, then_action, updated_at
        FROM action_plans WHERE session_id = ${id}
      `,
      ]);

    const analysisRow = analysisRows[0];
    const actionRow = actionRows[0];
    return {
      session: mapSession(row),
      answers: Object.fromEntries(
        answerRows.map((answer) => [answer.question_id, answer.answer]),
      ),
      followUps: followUpRows.map((followUp) => ({
        id: followUp.id,
        questionId: followUp.question_id,
        generatedQuestion: followUp.generated_question,
        userResponse: followUp.user_response,
        createdAt: followUp.created_at.toISOString(),
      })),
      analysis: analysisRow
        ? {
            version: analysisRow.version,
            model: analysisRow.model,
            result: analysisRow.result,
            createdAt: analysisRow.created_at.toISOString(),
          }
        : null,
      actionPlan: actionRow
        ? {
            direction: actionRow.direction,
            experiment: actionRow.experiment,
            immediateAction: actionRow.immediate_action,
            obstacle: actionRow.obstacle,
            ifCondition: actionRow.if_condition,
            thenAction: actionRow.then_action,
            updatedAt: actionRow.updated_at.toISOString(),
          }
        : null,
      entitlements: ["assessment", "full_analysis"],
    };
  }

  async updateProgress(
    id: string,
    chapter: ChapterId,
    questionId: string,
  ): Promise<Session | null> {
    const rows = await this.sql<SessionRow[]>`
      UPDATE assessment_sessions
      SET current_chapter = ${chapter}, current_question_id = ${questionId}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? mapSession(rows[0]) : null;
  }

  async saveAnswer(
    id: string,
    questionId: string,
    value: unknown,
  ): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO assessment_answers (session_id, question_id, answer)
      SELECT ${id}, ${questionId}, ${this.sql.json(value as never)}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      ON CONFLICT (session_id, question_id)
      DO UPDATE SET answer = EXCLUDED.answer, updated_at = now()
      RETURNING id
    `;
    return rows.length > 0;
  }

  async saveFollowUp(id: string, followUp: NewFollowUp): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO ai_followups (
        id, session_id, question_id, user_answer, generated_question, user_response, created_at
      )
      SELECT ${followUp.id}, ${id}, ${followUp.questionId}, ${followUp.userAnswer}, ${followUp.generatedQuestion},
        ${followUp.userResponse}, ${followUp.createdAt}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      RETURNING id
    `;
    return rows.length > 0;
  }

  async saveFollowUpResponse(
    id: string,
    followUpId: string,
    response: string,
  ): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      UPDATE ai_followups SET user_response = ${response}
      WHERE session_id = ${id} AND id = ${followUpId}
      RETURNING id
    `;
    return rows.length > 0;
  }

  async saveAnalysis(id: string, analysis: StoredAnalysis): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO assessment_analyses (session_id, version, result, model, created_at)
      VALUES (${id}, ${analysis.version}, ${this.sql.json(analysis.result)}, ${analysis.model}, ${analysis.createdAt})
      ON CONFLICT (session_id)
      DO UPDATE SET version = EXCLUDED.version, result = EXCLUDED.result,
        model = EXCLUDED.model, created_at = EXCLUDED.created_at
      RETURNING id
    `;
    if (rows.length === 0) return false;
    await this.sql`
      UPDATE assessment_sessions
      SET status = 'completed', completed_at = now(), updated_at = now()
      WHERE id = ${id}
    `;
    return true;
  }

  async setStatus(id: string, status: Session["status"]): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      UPDATE assessment_sessions SET status = ${status}, updated_at = now()
      WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }

  async saveActionPlan(id: string, input: ActionPlanInput): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      INSERT INTO action_plans (
        session_id, direction, experiment, immediate_action, obstacle, if_condition, then_action
      ) SELECT
        ${id}, ${input.direction}, ${input.experiment}, ${input.immediateAction}, ${input.obstacle},
        ${input.ifCondition}, ${input.thenAction}
      WHERE EXISTS (SELECT 1 FROM assessment_sessions WHERE id = ${id})
      ON CONFLICT (session_id)
      DO UPDATE SET direction = EXCLUDED.direction, experiment = EXCLUDED.experiment,
        immediate_action = EXCLUDED.immediate_action, obstacle = EXCLUDED.obstacle,
        if_condition = EXCLUDED.if_condition, then_action = EXCLUDED.then_action, updated_at = now()
      RETURNING id
    `;
    return rows.length > 0;
  }

  async deleteSession(id: string): Promise<boolean> {
    const rows = await this.sql<Array<{ id: string }>>`
      DELETE FROM assessment_sessions WHERE id = ${id} RETURNING id
    `;
    return rows.length > 0;
  }
}
