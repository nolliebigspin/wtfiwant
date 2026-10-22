-- A paid, bounded synthesis between refinement and the final report.
ALTER TABLE paid_ai_jobs DROP CONSTRAINT paid_ai_jobs_kind_check;
ALTER TABLE paid_ai_jobs ADD CONSTRAINT paid_ai_jobs_kind_check CHECK (kind IN ('plan', 'synthesis', 'report'));
ALTER TABLE paid_ai_jobs ADD COLUMN direction_review jsonb;
