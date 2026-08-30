CREATE TABLE ai_coach_prompts (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  chapter TEXT NOT NULL,
  question TEXT NOT NULL,
  evidence_question_ids TEXT[] NOT NULL,
  prompt_version TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  user_response TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, chapter)
);

CREATE INDEX ai_coach_prompts_session_idx ON ai_coach_prompts(session_id);
