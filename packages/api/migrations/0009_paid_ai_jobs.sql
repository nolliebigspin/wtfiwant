-- Frozen inputs and one bounded job per paid reflection/stage. Session deletion
-- removes both personal answers and queued work.
CREATE TABLE paid_ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('plan', 'report')),
  locale text NOT NULL CHECK (locale IN ('en', 'de')),
  input jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'ready', 'failed')),
  result jsonb,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  lease_token uuid,
  lease_until timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  delivery_state text NOT NULL DEFAULT 'pending' CHECK (delivery_state IN ('pending', 'sent', 'failed')),
  delivery_attempts integer NOT NULL DEFAULT 0,
  delivery_after timestamptz NOT NULL DEFAULT now(),
  responses jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, kind)
);
CREATE INDEX paid_ai_jobs_pending ON paid_ai_jobs(next_attempt_at) WHERE status IN ('queued', 'running');
