# Commerce operations

## Runtime and migration

The existing `migrate` service applies `0011_commerce_legal_records.sql` before
`web` and `report-worker` start. No new service, public admin page, API key or
environment variable is required. Keep the report worker running: it now delivers
contract and withdrawal confirmations as well as paid reports.

The migration copies existing paid purchase evidence into a separate ledger,
without emailing historical buyers or modifying their saved agreement text.
Deleting a reflection cascades through its answers, report and AI jobs. It does
not delete the separate minimal purchase/contract/payment evidence or independent
withdrawal declaration. These records contain no reflection answers or report.
Retention periods and backup/deletion procedures still require an approved policy.

## Stripe endpoint

The existing live snapshot endpoint `/api/stripe/webhook` must subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

Keep the existing endpoint URL and signing secret. Do not subscribe to all events.
Signature verification happens before any update; duplicate events are harmless.
Only payment intent, currency, amounts, event type/ID and dispute status are kept
from adjustment events. Unmatched references await their Checkout for up to seven
days and are pruned hourly by the worker. Older unmatched cases need investigation
in Stripe; pruning is not a finding that the payment never existed.

Full refunds remove paid access and cancel queued/running AI jobs. A provider call
already in flight cannot be recalled, but its cancelled job cannot publish a new
result. Partial refunds and disputes alone preserve access. Previously delivered
emails/PDF copies cannot be recalled. Refunds do not erase the reflection. A new
purchase after a full refund requires a new reflection, preserving the original
purchase evidence. No code here initiates refunds or submits dispute evidence.

## Confirmation queue

New agreement version `2026-10-23.2` requires the independent contract email before
paid AI work. Original terms and consent are frozen per purchase. The browser
shows a waiting message while its confirmation is pending. Provider acceptance
is recorded; it does not prove inbox receipt or legally establish withdrawal
expiry. Monitor bounces in Resend and contact the buyer where appropriate.

Withdrawal declarations are saved before mail is attempted. The original receipt
timestamp remains unchanged on repeated submissions. The customer confirmation
has a support BCC. An email failure does not invalidate receipt of the declaration.
Support must review and process it; the app does not decide its legal validity.

Messages use five-minute worker leases, stable idempotency keys and exponential
backoff starting at one minute. Automatic retries stop after eight attempts or
23 hours from the first attempt, before Resend's 24-hour idempotency window ends.
This limits duplicates during failures; it is not permanent exactly-once delivery.
Do not reset failed rows or generate fresh keys blindly: first check Resend's
actual send history, delivery status and the purchase/declaration record. A stale
worker cannot acknowledge another worker's lease.

## Monitoring and recovery

Run in the Dokploy `web` or `report-worker` container with its existing environment:

```sh
bun /app/commerce-reconcile.js
bun /app/commerce-reconcile.js --retry-notifications
```

For local tooling, use `mise exec -- bun run commerce:reconcile`; do not copy
production keys into shell arguments. The command prints aggregate counts only.
The retry flag processes due notifications under the same retry limits, not
exhausted jobs. The legacy `--retry-withdrawals` flag remains compatible.

Review failed notifications, long-pending confirmations, unmatched payment events
and report issues. Report issue counts can include purchases still completing
their optional questions; they are a triage signal, not proof of non-delivery.
Recorded dispute counts are historical events, not a count of unresolved cases.
There is no external paging integration or support case management in this change.
Keep an operational support inbox and documented responsibility for checking it.

For a full refund, use Stripe's normal merchant workflow and confirm the signed
`charge.refunded` delivery succeeds. Do not use an actual charge/refund as a health
check. Automated tests cover signature failures, lease retries, deletion survival,
migration/backfill, partial/full refunds, event replay and concurrent/out-of-order
payment/refund updates in an isolated PostgreSQL schema.
