ALTER TABLE report_purchases
  ADD COLUMN agreement JSONB NULL,
  ADD COLUMN consent_recorded_at TIMESTAMPTZ NULL;

-- No reflection content or foreign key: a declaration must remain available
-- even when the customer has deleted the reflection being withdrawn.
CREATE TABLE withdrawal_requests (
  request_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contract_reference TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'de')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmation_sent_at TIMESTAMPTZ NULL
);
