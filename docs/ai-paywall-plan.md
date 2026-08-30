# AI-assisted reflection and paid Compass plan

Status: Ready for implementation

## Outcome

Make the form feel intelligently responsive without letting AI answer for the person, then sell one complete Compass per Reflection Session. A person completes the Reflection anonymously, sees a useful Compass Preview, pays once in Stripe Checkout, immediately unlocks the Full Compass in the browser, and receives the Full Compass by email.

This is not an account or subscription launch. Price and currency live in a Stripe Price and can change without a code change.

## Current baseline

The repository already has the right foundations:

- fixed, durable question IDs and strict answer validation in `packages/shared`;
- optional AI-generated follow-ups, but only after the final fixed question;
- structured, evidence-linked analysis with a repair attempt and a safety pause;
- an `assessment` / `full_analysis` entitlement shape, currently hard-coded to grant both;
- anonymous resumable sessions, cascade deletion, and no payment or email provider.

The work should extend these seams instead of introducing accounts, a separate API deployment, or browser-side business rules.

## Product decisions

### 1. AI helps the person think; it never writes their answer

Keep the fixed questions as the backbone of the Reflection. At the end of each chapter, the backend may offer at most one optional Coach Prompt based on that chapter's saved answers. It should ask for a concrete example, an underlying need, or a useful distinction. It must not diagnose, advise, praise, summarize the person, or propose answer text.

The person can answer or skip. Skipping never blocks progress or reduces the promised Full Compass. Generate only at chapter boundaries, not after every field: this gives the experience a responsive feel without adding latency, cost, and interruption to every screen.

Coach Prompt generation should return a strict object containing:

- `question`;
- `evidenceQuestionIds` (one or more saved fixed-question IDs from the current chapter);
- `promptVersion`.

Reject unknown evidence IDs, enforce the existing safety check before sending text to the AI provider, cap generation to one prompt per chapter, and fail open by continuing to the next chapter when generation is unavailable.

### 2. The free/paid boundary sits after completion and before the complete result

Completing the Reflection remains free. Generate the Compass once at completion and store it server-side, then expose only a server-created Compass Preview until payment. Never send the Full Compass to an unpaid browser and blur or hide it with CSS.

The free Compass Preview contains:

- the personalized summary;
- one core driver with its cited evidence;
- the names, but not the explanations, of the remaining result sections;
- a clear list of what the Full Compass adds.

The Full Compass contains the current complete result: all drivers, tensions, Anti-Life, outside influences, directions, goal interpretations, evidence drawers, and action-plan builder.

This preserves a meaningful free outcome while making the paid value legible. It also avoids generating a cheap teaser and a potentially contradictory paid analysis.

### 3. One-time Stripe Checkout, attached to the Reflection Session

Use a Stripe-hosted Checkout Session in `payment` mode. Stripe Checkout collects the email and payment details; the application never receives or stores card data. Do not save payment methods for future use and do not create an application account.

Create Checkout on the server with:

- one configured Stripe Price ID;
- the Reflection Session ID as `client_reference_id` and non-sensitive metadata;
- locale-aware success and cancel URLs;
- automatic tax behind an environment flag, enabled only after Stripe Tax registrations and product tax code are configured.

Do not create a reusable Stripe Customer for the initial one-time product. Read the required Report Recipient from the completed Checkout Session's `customer_details.email`. If tax or invoicing requirements later make a Customer necessary, add it as a deliberate migration rather than collecting more durable payment identity now.

Creating Checkout must be idempotent for a session with an active unpaid Checkout Session. A paid Reflection Session must return its existing entitlement instead of creating another charge.

Stripe recommends Checkout Sessions for most integrations and requires webhook-backed fulfillment. The fulfillment function must verify payment status and be safe when called repeatedly or concurrently. See [Stripe Checkout Sessions](https://docs.stripe.com/payments/checkout-sessions), [Create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create), and [Fulfill orders](https://docs.stripe.com/checkout/fulfillment).

### 4. Fulfillment is server-authoritative and idempotent

Add a raw-body webhook route and verify `Stripe-Signature` before parsing. Handle:

- `checkout.session.completed` for immediately paid methods;
- `checkout.session.async_payment_succeeded` for delayed methods;
- `checkout.session.async_payment_failed` to mark the attempt failed;
- `checkout.session.expired` to close an abandoned attempt.

Both the webhook and the success-return endpoint call the same `fulfillCheckout(checkoutSessionId)` service. The webhook is the reliability path; the return endpoint makes browser unlock feel immediate. Fulfillment retrieves the Checkout Session from Stripe, checks `payment_status`, locks the purchase row, and creates the Full Compass Entitlement at most once.

Do not grant access from query parameters, client state, a successful redirect alone, or an unverified webhook payload. Stripe requires the raw request body for signature verification; see [Stripe webhook signature verification](https://docs.stripe.com/webhooks/signature).

### 5. Email the report after payment, with an explicit privacy warning

Use an `EmailDeliveryProvider` seam in `packages/api`, with Resend as the first production adapter and a local capture adapter for tests/development. Send only after a Full Compass Entitlement exists.

The purchase screen must say plainly that the email will contain sensitive personal reflection content. The email contains the complete result in readable HTML plus a secure browser link; never attach the raw answer set, prompt, model payload, or payment data. Include the privacy/delete link and the guided-reflection disclaimer.

Record an email delivery row before attempting delivery. Use the purchase ID as the provider idempotency key, persist provider message ID and status, and allow a paid person to request a rate-limited resend. A delivery failure must not revoke browser access. Resend supports send idempotency keys and delivery/bounce events; see [Resend send email](https://resend.com/docs/api-reference/emails/send-email) and [Resend email events](https://resend.com/docs/webhooks/event-types).

### 6. Entitlements and API projections enforce the paywall

Stop returning stored full analysis inside the general Session View. Split the read contracts into:

- a Reflection Session view: progress, saved answers, Coach Prompts, status, entitlement names, and optional Compass Preview;
- a paid Full Compass response available only through an entitlement-checked endpoint.

Derive `full_analysis` from a fulfilled purchase in both repositories. Keep `assessment` granted by default. The result page renders from these server projections; it does not infer access from Stripe state in the browser.

Because the app is anonymous, the Full Compass Entitlement belongs to the Reflection Session. The existing session URL remains a bearer secret. Email the secure result URL, never put answers or email addresses in it, and add `Referrer-Policy: no-referrer` plus `noindex` on reflection/result pages. A stronger account system is deliberately out of scope.

## Data model

Add append-only migrations for:

### `report_purchases`

- `id` UUID primary key;
- `session_id` UUID, unique, cascade-delete with the Reflection Session;
- `status`: `checkout_open | paid | failed | expired | refunded`;
- `stripe_checkout_session_id`, unique;
- `stripe_payment_intent_id`, nullable and unique when present;
- `recipient_email`, nullable until Stripe supplies it;
- `currency`, `amount_total`, and `paid_at`;
- timestamps.

### `report_deliveries`

- `id` UUID primary key;
- `purchase_id` UUID;
- `status`: `pending | sent | delivered | delayed | bounced | failed`;
- `provider_message_id`, nullable and unique;
- `attempt_count`, `last_error_code`, and timestamps;
- unique `(purchase_id, delivery_kind)` for one initial Full Compass delivery.

### `processed_webhook_events`

- provider plus event ID as a unique key;
- processed timestamp.

Store operational error codes, never raw provider payloads, answer text, assembled prompts, or credentials. Deleting a Reflection Session deletes local answers, Compass, purchase linkage, recipient email, and delivery records; Stripe retains the financial record under the merchant's legal retention duties.

## API and service changes

Add strict shared schemas for every request and response, then expose these public seams:

- `POST /sessions/:id/coach-prompt` — generate the current chapter's optional Coach Prompt; replace the current final-question-only behavior.
- `POST /sessions/:id/analyze` — complete generation but return `safety_paused`, `preview_ready`, or the already-paid Full Compass projection.
- `GET /sessions/:id/preview` — return the safe Compass Preview projection.
- `GET /sessions/:id/compass` — return `402 payment_required` without entitlement and the Full Compass when entitled.
- `POST /sessions/:id/checkout` — create/reuse hosted Checkout and return its URL.
- `POST /stripe/webhook` — verify and fulfill Stripe events.
- `POST /checkout/:checkoutSessionId/fulfill` — authenticated-by-Stripe-retrieval success-return helper; it never trusts the browser's claim.
- `POST /sessions/:id/report-email` — rate-limited resend for a paid session.

Extend `AssessmentRepository` with narrow purchase, entitlement, webhook-event, and delivery methods. Put Stripe, email, and fulfillment behind replaceable interfaces injected into `createApp`; keep `createApp` free of Next.js imports and keep the Next catch-all route a thin lazy-construction adapter.

## User journey

1. The person starts or resumes an anonymous Reflection.
2. After each chapter's fixed questions, an optional Coach Prompt may appear.
3. At completion, safety classification runs and the Compass is generated once.
4. The result page shows the Compass Preview and a single purchase action: “Get my Full Compass”.
5. Stripe-hosted Checkout collects email, billing information, and payment.
6. On return, the server verifies Stripe state and shows `processing`, `paid`, or `failed`; paid access appears without requiring the email to arrive.
7. Fulfillment grants the entitlement and sends the complete result to the Report Recipient.
8. The paid result page offers “send again” and the existing delete action.

Cancellation returns to the intact preview. Refreshing, duplicate clicks, Stripe retries, and multiple tabs must not create duplicate purchases, entitlements, or initial emails.

## Delivery sequence

### Slice 1 — AI coaching at chapter boundaries

- Generalize follow-ups into evidence-linked Coach Prompts.
- Add chapter-boundary orchestration and UI with answer/skip behavior.
- Preserve safety, locale, prompt versioning, caps, and fail-open navigation.
- Test generation, invalid evidence, caps, restoration, skipping, and provider failure through public HTTP/UI seams.

### Slice 2 — Real preview and entitlement enforcement

- Split Session View, Compass Preview, and Full Compass contracts.
- Add a deterministic preview projector over the stored Compass.
- Make the repositories derive entitlements instead of hard-coding them.
- Add the preview/paywall UI using a fake payment adapter first.
- Prove in API tests that unpaid clients never receive hidden fields.

### Slice 3 — Stripe purchase and fulfillment

- Add Stripe configuration, adapter, migrations, Checkout endpoint, raw-body webhook, and shared idempotent fulfillment service.
- Support immediate, delayed, failed, expired, duplicate, and concurrent events.
- Add success/cancel states and test with adapter fixtures; then run a Stripe test-mode smoke test and Stripe CLI webhook test.

### Slice 4 — Full Compass email

- Add the email provider seam, Resend/local adapters, HTML report renderer, delivery records, and resend endpoint.
- Add delivery status handling for delivered, delayed, bounced, and failed events if operational visibility is required at launch.
- Test that email is paid-only, localized, contains the complete Compass but no raw answers, and is sent once under retries.

### Slice 5 — Privacy, operations, and launch controls

- Update English/German copy, privacy notice, terms, refund wording, and email-content warning.
- Add secret/config validation for Stripe and email, with payments disabled cleanly when unconfigured.
- Add metadata-only observability: counts and timings by outcome, never answers, prompts, email addresses, or credentials.
- Add an admin reconciliation script for paid purchases missing entitlement or email delivery.
- Gate launch behind `PAYMENTS_ENABLED`; exercise preview-only mode, Stripe test mode, and a low-price live-mode purchase before enabling the real Price.

## Verification gates

Each slice must pass behavior tests at the public seams plus:

```bash
mise exec -- bun run typecheck
mise exec -- bun test
mise exec -- bun run lint
mise exec -- bun run build
```

Critical acceptance cases:

- AI provider failure never loses an answer or traps the person.
- Safety-paused sessions cannot generate Coach Prompts, preview, checkout, Full Compass, or email.
- An unpaid session cannot obtain any Full Compass field from any endpoint.
- A paid session remains unlocked when email delivery fails.
- A successful payment is fulfilled exactly once under webhook retries and concurrent return-page fulfillment.
- No route, log, analytics event, Stripe metadata, or email subject contains reflection answers.
- Deleting a session removes local sensitive data and makes its bearer result URL unusable.
- German and English purchase, result, and email flows preserve the analysis locale.

## Deliberately deferred

- accounts, login, cross-device libraries, and purchase history;
- subscriptions or saved payment methods;
- AI-authored answer suggestions or a general chatbot;
- coupons, gifting, teams, and multiple report products;
- PDF attachments (HTML email and browser result launch first);
- automatic entitlement revocation after refund, because an emailed digital result cannot be recalled; record refund status and define the commercial policy before automating it.
