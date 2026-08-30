CREATE TABLE report_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('checkout_open', 'paid', 'failed', 'expired', 'refunded')),
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  checkout_url TEXT NOT NULL,
  stripe_payment_intent_id TEXT NULL UNIQUE,
  recipient_email TEXT NULL,
  currency TEXT NULL,
  amount_total INTEGER NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES report_purchases(id) ON DELETE CASCADE,
  delivery_kind TEXT NOT NULL DEFAULT 'full_compass',
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'delayed', 'bounced', 'failed')),
  provider_message_id TEXT NULL UNIQUE,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_error_code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, delivery_kind)
);

CREATE TABLE processed_webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id)
);
