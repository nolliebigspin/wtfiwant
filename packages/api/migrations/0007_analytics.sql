-- Analytics is deliberately separate from reflection content and bearer IDs.
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  visit_id UUID NOT NULL,
  name TEXT NOT NULL,
  page TEXT NOT NULL,
  locale TEXT NOT NULL,
  step SMALLINT,
  attribution JSONB NOT NULL DEFAULT '{}',
  amount_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_created ON analytics_events(created_at);
CREATE INDEX analytics_events_visit ON analytics_events(visit_id);
CREATE TABLE analytics_checkouts (
  checkout_hash TEXT PRIMARY KEY,
  visit_id UUID NOT NULL,
  attribution JSONB NOT NULL DEFAULT '{}',
  locale TEXT NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analytics_checkouts_created ON analytics_checkouts(created_at);
-- Prevent late/in-flight requests from recreating a withdrawn visit. No FK to
-- assessments: analytics cannot retrieve a person's reflection or email.
CREATE TABLE analytics_revocations (
  visit_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
