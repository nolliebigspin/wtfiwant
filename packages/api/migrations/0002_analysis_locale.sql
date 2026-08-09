ALTER TABLE assessment_analyses
ADD COLUMN locale TEXT NOT NULL DEFAULT 'en'
CHECK (locale IN ('en', 'de'));

ALTER TABLE ai_followups
ADD COLUMN locale TEXT NOT NULL DEFAULT 'en'
CHECK (locale IN ('en', 'de'));
