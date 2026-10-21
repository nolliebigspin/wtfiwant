-- Keep the previous migration append-only. These rows now form a short-lived
-- delivery outbox, not a reporting database. Umami owns charts and history.
ALTER TABLE analytics_events
  ADD COLUMN delivered_at TIMESTAMPTZ,
  ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN currency TEXT;

-- Earlier local-dashboard events were not collected under the Umami notice.
-- Preserve them until normal pruning, but do not backfill them to Umami.
UPDATE analytics_events SET delivered_at = now();
CREATE INDEX analytics_events_pending ON analytics_events(retry_at)
  WHERE delivered_at IS NULL;
