ALTER TABLE processed_webhook_events
  ADD COLUMN status TEXT NOT NULL DEFAULT 'processed'
    CHECK (status IN ('processing', 'processed')),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
