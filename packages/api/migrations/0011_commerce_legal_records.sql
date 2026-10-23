-- This ledger deliberately has no FK to a reflection and contains no answers,
-- generated report, result URL or reflection session ID.
CREATE TABLE purchase_legal_records (
  purchase_id UUID PRIMARY KEY,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT NULL UNIQUE,
  receipt JSONB NOT NULL,
  confirmation_sent_at TIMESTAMPTZ NULL,
  refunded_amount INTEGER NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO purchase_legal_records (purchase_id, stripe_checkout_session_id, stripe_payment_intent_id, receipt)
SELECT id, stripe_checkout_session_id, stripe_payment_intent_id,
  jsonb_build_object('purchaseId', id, 'checkoutSessionId', stripe_checkout_session_id,
    'paymentIntentId', stripe_payment_intent_id, 'recipientEmail', recipient_email,
    'amountTotal', amount_total, 'currency', currency, 'paidAt', paid_at,
    'agreement', agreement, 'consentRecordedAt', consent_recorded_at)
FROM report_purchases WHERE paid_at IS NOT NULL AND recipient_email IS NOT NULL;

CREATE TABLE commerce_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('purchase_confirmation', 'withdrawal_confirmation')),
  reference_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMPTZ NULL,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lease_token UUID NULL,
  lease_until TIMESTAMPTZ NULL,
  provider_message_id TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, reference_id)
);
CREATE INDEX commerce_notifications_due ON commerce_notifications (next_attempt_at)
  WHERE status IN ('pending', 'sending');

-- Retry existing failed withdrawal receipts, but do not email historical buyers.
INSERT INTO commerce_notifications (kind, reference_id, status, sent_at)
SELECT 'withdrawal_confirmation', request_id,
  CASE WHEN confirmation_sent_at IS NULL THEN 'pending' ELSE 'sent' END,
  confirmation_sent_at FROM withdrawal_requests;

CREATE TABLE payment_adjustments (
  event_id TEXT PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchase_legal_records(purchase_id),
  event_type TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  provider_status TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stripe does not guarantee delivery order. Retain only the normalized payment
-- reference/amount while awaiting its Checkout; discard unmatched rows in 7 days.
CREATE TABLE unmatched_payment_adjustments (
  event_id TEXT PRIMARY KEY,
  stripe_payment_intent_id TEXT NOT NULL,
  event JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
