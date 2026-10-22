# wtfiwant.app

A private, anonymous guided reflection for one difficult question: **What the fuck do I actually want?**

This is not a personality test, therapy app, happiness score, chatbot, or productivity tracker. It moves through **STOP → UNDERSTAND → START**: concrete memories, outside expectations, imagined lives, real trade-offs, an explicit Anti-Life, cautious pattern analysis, and one reversible real-world experiment.

## What is included

- Anonymous UUID sessions with server-side resume and cascade deletion
- A seven-chapter, one-screen-at-a-time reflection that works on mobile and desktop
- Data-defined questions and interaction types: text, choices, memories, Three Lives, trade-offs, and goals
- Optional evidence-linked AI Coach Prompts at chapter boundaries
- Replaceable AI providers with backend-only credentials, versioned prompts, strict output validation, and one repair attempt
- A credential-free local analysis provider for private development
- A pre-analysis safety layer that pauses ordinary motivational analysis for possible immediate self-harm danger
- Explainable Compass, Tensions, Anti-Life, possible directions, and evidence drawers tied to saved question IDs
- Direction → Experiment → Now planning and an editable If → Then intention
- A server-enforced Compass Preview / Full Compass boundary
- One-time Stripe-hosted Checkout with idempotent webhook fulfillment
- Paid Full Compass delivery and explicit resend through a replaceable email provider
- Three development-only completed personas
- PostgreSQL migrations, Docker Compose, a production Dockerfile, and behavior tests

## Architecture

```text
apps/
  web/       Next.js 16 App Router UI, and the API mounted at /api
packages/
  api/       Hono app, domain rules, AI, safety, PostgreSQL
  shared/    Zod contracts and assessment configuration
```

This is a single deployable. `packages/api` is a library exporting `createApp`, which `apps/web` mounts as a catch-all route handler at [`src/app/api/[[...route]]/route.ts`](apps/web/src/app/api/[[...route]]/route.ts). Requests are same-origin, so there is no CORS layer and no browser-visible API origin. Database and AI credentials stay server-side.

Hono was chosen for the backend because its small Web-standard interface is easy to exercise as HTTP in tests and does not impose a second large application framework. Because `createApp` takes its dependencies and base path as parameters, the same app runs unchanged under Next in production and mounted at `/` in tests. PostgreSQL sits behind an `AssessmentRepository` seam. Production uses `PostgresAssessmentRepository`; tests use the same interface with an in-memory adapter. AI follows an equivalent `AIProvider` seam.

See [the implementation plan](docs/implementation-plan.md) for the initial architecture and schema decisions.

## Prerequisites

- [mise](https://mise.jdx.dev/)
- Docker with Compose, or PostgreSQL 15+

Bun is pinned in `.mise.toml`. Every command below runs it through mise.

## Local setup

```bash
cp .env.example .env
mise install
mise exec -- bun install
docker compose up -d postgres
mise exec -- bun run db:migrate
```

Start the application:

```bash
mise exec -- bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Environment variables

| Variable | Used by | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | Server | PostgreSQL connection string |
| `AI_PROVIDER` | Server | `local` or `openai` |
| `AI_API_KEY` | Server | Required only for `AI_PROVIDER=openai` |
| `AI_MODEL` | Server | Structured analysis model |
| `AI_FOLLOWUP_MODEL` | Server | Targeted follow-up model |
| `PAYMENTS_ENABLED` | Server | `true` enables paid Full Compass Checkout; otherwise the app remains free-checkpoint-only |
| `PAYMENT_TEST_ENABLED` | Server | `true` shows the instant payment test form on `/commitment` in development; default `false`, ignored in production |
| `EMAIL_PROVIDER` | Server | `resend` sends reports; `local` captures them in memory outside production |
| `TERMS_URL`, `REFUND_POLICY_URL` | Server | Public merchant policies linked beside the purchase action; required when payments are enabled |
| `PUBLIC_APP_URL` | Server | Canonical HTTPS origin used for Stripe returns and private report links |
| `STRIPE_SECRET_KEY` | Server | Stripe secret key |
| `STRIPE_PRICE_ID` | Server | One-time Price for a Full Compass |
| `STRIPE_WEBHOOK_SECRET` | Server | Signing secret for `/api/stripe/webhook` |
| `STRIPE_AUTOMATIC_TAX` | Server | Enables Stripe Tax after registrations and product tax code are configured |
| `RESEND_API_KEY` | Server | Transactional report-email credential |
| `REPORT_EMAIL_FROM` | Server | Verified sender, for example `wtfiwant <compass@example.com>` |

All of these are server-only and read inside route handlers. None is exposed as `NEXT_PUBLIC_*`.

For local Resend operations, prefer the installed `resend` CLI. Authenticate with
`resend login` and check the active profile with `resend whoami`. Sending-only
credentials permit sending mail; inspecting deliveries and managing domains require
full access. Keep credentials in the CLI's secure storage, never in tracked files.

`AI_PROVIDER=local` is the default. It sends no reflections to an external AI service and produces cautious deterministic hypotheses for development. To use OpenAI, set `AI_PROVIDER=openai` and provide a key plus models. The adapter uses the Responses API with Zod-backed structured output; all returned data is still validated locally before it can be stored or shown.

No reflection answer or assembled prompt is intentionally written to application logs. Optional Umami analytics measures the product funnel without sending reflection content.

## Database and migrations

The initial migration is `packages/api/migrations/0001_initial.sql`. It creates:

- `assessment_sessions`
- `assessment_answers`
- `ai_followups`
- `assessment_analyses`
- `action_plans`

All child tables reference the anonymous session with `ON DELETE CASCADE`. A nullable `user_id` on sessions leaves room for later accounts without rewriting assessment data.

Apply migrations with:

```bash
mise exec -- bun run db:migrate
```

## Assessment configuration

Chapters, question IDs, prompts, interaction types, options, and required flags live in `packages/shared/src/assessment.ts`. The web app renders the discriminated question type; the API validates values against the same configuration.

Question IDs are durable evidence references stored in analyses. Treat a released ID like database schema: add new questions freely, but do not rename IDs without a migration plan.

The selected locale controls generated report content, including development
shortcuts. Checkout records the purchase language, which is used for the initial
report email and resends even if the result page is later viewed in another
language. Evidence labels and saved choice values are localized; written answers
are quoted as entered.

## Free checkpoint and paid AI journey

`packages/shared/src/journey.ts` defines a seven-screen free path. The fifth answer selects either a question about life by default or outside expectations. The checkpoint mirrors explicit answers and trade-offs and supplies a rule-based reflection prompt. It never calls an AI provider. The actual Stripe price is disclosed on landing, commitment and checkpoint through `/api/commerce/offer`.

After Stripe independently confirms payment, the server enqueues one refinement-plan job. Up to five AI questions clarify ordinary life, priority, compromises and constraints. Users can skip them, then review one proposed north star and priority. They actively accept, edit or mark it uncertain; their wording and alignment status are preserved in the report. A synthesis job freezes the refinement answers; the final report freezes that draft and its review. The worker creates, validates and saves an actionable compass (90-day goal, first action, four weeks, obstacles, decision rules and review) before delivering its email/PDF. Web, email and PDF use the same underlying compass data. PDFs use a vector direction map, a four-week roadmap, a three-way review guide, space for the reader’s own decision and a separate source appendix. These diagrams do not assign personality scores or imply completed progress. Optional evidence fields keep existing saved reports readable; new AI outputs must cite constraints in the goal, first action, obstacles and decision rules. Responses and report language are pinned to the purchase. Refreshes, duplicate webhooks, downloads, resends and locale changes do not create additional AI generations. Old local previews are never reused by the paid job.

Start a separate worker during local development (in addition to `dev`):

```bash
mise exec -- bun run --env-file=.env packages/api/src/journey/worker.ts
```

Dokploy Compose includes `report-worker` automatically, using the web service's runtime environment. Keep both services running. Migrations `0009_paid_ai_jobs.sql` and `0010_direction_review.sql` add the durable queue and review stage; no Redis or external queue account is needed. Test the final Docker image as well as the Next build because the worker bundles PDF/email dependencies and fonts.

Each stage has an atomic five-minute lease and at most three job attempts. Each stage attempt can make one schema/evidence repair request. A paid report also receives one validated editorial pass before publication; it checks contradictions, controllable progress criteria, source support and natural wording. With 90-second request timeouts this bounds a report attempt to three requests (270 seconds) within its five-minute lease. Editing never runs on downloads, resends or saved report reads. Evidence identifiers in generated prose are rejected as well as unknown reference IDs. SDK retries are disabled; requests have a 90-second timeout and bounded output. A timed-out provider request may already have been billed, so this is a bounded retry policy, not a promise of exactly-once API billing. The report is saved atomically with completion of its job. Email failures retry separately without regenerating AI content.

If optional questions are abandoned for 30 minutes after planning/the last saved answer, the worker prepares a synthesis. After another 30 minutes without review it generates a report labelled not reviewed; it never invents user approval. Failed question preparation falls back to synthesis; exhausted synthesis attempts fall back to an unconfirmed report. A saved review with an interrupted report enqueue is automatically recovered by the worker. Each of the three stages has one unique job; browser refreshes cannot start an unbounded conversation. After the report's retry budget is exhausted the UI preserves the purchase and points to merchant support; browser requests cannot reset the budget. Inspect only job kind/status/attempts when investigating—never log job input, model output, or provider error bodies. Session deletion cascades to the queue.

Production purchases require `AI_PROVIDER=openai` and a funded API project. Both models default to `gpt-6-luna`; override `AI_MODEL` and `AI_FOLLOWUP_MODEL` independently if evaluated report quality warrants it. The OpenAI SDK must support Zod 4; the adapter's HTTP contract test guards against serializing the object schema as a scalar.

### Compass quality gate

Before changing the paid prompts or model, inspect complete outputs for a career-focused case, a constrained caregiving case, sparse/uncertain answers, and a user correction that reverses the initial priority, in both supported languages. The current change was manually exercised with real German and English OpenAI outputs; automated tests enforce structure, evidence references, correction persistence, uncertainty labels, stage idempotency and recovery.

A useful report must preserve the person's chosen wording, let that choice govern the **whole** plan (including the first action), name one observable 90-day goal within their influence, offer four feasible weekly steps with done conditions, handle real obstacles, and provide a week-four continue/adjust/stop decision. Unknown areas must remain unknown, and unreviewed proposals must never appear confirmed. Reject generic praise, invented constraints, unsupported identity claims, raw evidence IDs in prose and a report that merely repeats the user's own suggested experiment. Structured validation cannot establish personal usefulness: beta users should be able to name their direction and next action, then explain after a real trial what they would keep or change. Future habit/planning integrations should follow that chosen goal; none are enabled here.

## AI prompts and output

Prompts are not scattered through routes:

```text
packages/api/src/prompts/
  analysis.ts
  coach.ts
  follow-up.ts
  action-plan.ts
  refinement.ts
  context.ts
```

`ANALYSIS_PROMPT_VERSION` is stored with every analysis. The strict Zod contract is `analysisSchema` in `packages/shared/src/schemas.ts`. Generated data must pass both structural validation and an evidence check proving every cited question ID exists in the submitted answers. Invalid output receives one repair attempt, then fails closed.

The current OpenAI adapter follows the official [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).

## Seed a completed reflection

In development, open `/commitment` and use one of the three development shortcuts:

1. Career-focused but burned out
2. Freedom-oriented but afraid of losing relationships
3. Stable life but unsure whether they want more adventure

Or call the development endpoint directly. Seeded sessions show the same unpaid Compass Preview as a completed reflection, so payment remains a real server-enforced boundary:

```bash
curl -X POST http://localhost:3000/api/dev/seed/burned_out
curl -X POST http://localhost:3000/api/dev/seed/freedom_relationships
curl -X POST http://localhost:3000/api/dev/seed/stable_adventure
```

The endpoints and UI shortcuts do not exist when `NODE_ENV=production`.

### Test payment without completing the reflection

Set these variables in your root `.env`, using a Stripe test secret key and a
one-time Price from the same Stripe test account:

```dotenv
PAYMENT_TEST_ENABLED=true
PAYMENTS_ENABLED=true
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_PRICE_ID=price_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_AUTOMATIC_TAX=false
PUBLIC_APP_URL=http://localhost:3000
EMAIL_PROVIDER=local
TERMS_URL=http://localhost:3000/terms
REFUND_POLICY_URL=http://localhost:3000/refunds
```

Keep your normal `DATABASE_URL` configured and run migrations. For local webhook
delivery, sign in with `stripe login`, then leave this listener running:

```bash
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired --forward-to localhost:3000/api/stripe/webhook
```

Copy the listener's signing secret into `STRIPE_WEBHOOK_SECRET`, then restart
`mise exec -- bun run dev`. Open `/en/commitment` (or `/de/commitment`), find
**Test payment**, choose a sample reflection, and click **Open Stripe Checkout**.
This creates a completed sample using the local analysis provider and immediately
opens the existing Checkout flow. It still requires confirmed payment to unlock
the Full Compass; returning from Checkout exercises the normal result page and
fulfillment logic. Failed Checkout requests reuse the sample session on retry.

For a successful test payment, use `4242 4242 4242 4242`, a future expiry, and any
three-digit CVC. See [Stripe testing](https://docs.stripe.com/testing) and the
[Stripe CLI listener](https://docs.stripe.com/cli/listen).

`EMAIL_PROVIDER=local` captures delivery in server memory without sending mail.
To test actual email delivery, use `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and
a verified `REPORT_EMAIL_FROM`. The test form uses the configured Stripe Price;
the boolean does **not** switch Stripe into test mode. Both the form and its seed
endpoint remain unavailable in production.

## Verification

```bash
mise exec -- bun run lint
mise exec -- bun run typecheck
mise exec -- bun test
mise exec -- bun run build
```

The backend tests exercise session creation, answer validation and restoration, structured-analysis repair, the safety state, invalid sessions, and deletion through the Hono app's public interface, mounted directly with an in-memory repository. The frontend tests exercise restoration, required answers, save-before-navigation, analysis rendering, evidence disclosure, and action-plan persistence.

## Production deployment

### Terms and refund policy

The app serves `/en/terms`, `/en/refunds`, `/de/terms`, and `/de/refunds`.
The `/terms` and `/refunds` URLs redirect to the visitor's locale. Both pages
are linked from the site footer and the configured purchase links. The content
is maintained in `apps/web/src/components/legal/legal-content.ts`.

For the production domain, configure:

```dotenv
PUBLIC_APP_URL=https://wtfiwant.app
TERMS_URL=https://wtfiwant.app/terms
REFUND_POLICY_URL=https://wtfiwant.app/refunds
```

`PUBLIC_APP_URL` also determines Stripe's return URLs and private report-email
links. Keep all three URLs on `http://localhost:3000` while testing locally if
the production domain is not deployed yet.

The Full Compass is a premium digital purchase with **no voluntary refunds**.
Mandatory consumer rights remain unaffected. Stripe Checkout requires an unchecked
consent checkbox for early delivery and acknowledgement of the loss of withdrawal
rights. For digital content, this refers to the **start** of performance. Configure
`https://wtfiwant.app/terms` as the terms of service URL in Stripe Dashboard →
Business → Public details, in both sandbox and live environments. Stripe requires
this dashboard setting independently of the app's `TERMS_URL` variable.

Migration `0006_purchase_consent_and_withdrawals.sql` stores the exact localized
consent and policy text with each new Checkout and the time accepted consent is
retrieved from Stripe. Fulfillment checks Stripe consent before unlocking new
purchases. Initial and resent report emails include the purchase details, consent,
and complete saved terms/refund text. Existing purchases have no retroactive consent.
Do not treat an email API accepting a message as proof it reached the customer's inbox.

The `/en/withdraw` and `/de/withdraw` pages provide a two-step statutory withdrawal
form, linked prominently in the footer. Declarations are stored before email is
attempted, with their original receipt time preserved on retries. The customer gets
an email receipt, with a copy to support at `contact@awinter.dev`. Requests are
reviewed manually; this does not issue automatic Stripe refunds. Receipt records
contain the submitted contact/contract details, no reflection answers, and remain
available after a reflection is deleted so the declaration can still be processed.
Apply your retention policy to these records after processing.

`commerce:reconcile` reports pending withdrawal confirmations. Use
`mise exec -- bun run --env-file=.env packages/api/src/commerce/reconcile.ts --retry-withdrawals`
to retry failed confirmation emails; monitor and run promptly after delivery errors.
The form also permits retrying the confirmation without changing receipt time.
Review the seller/contact details and legal wording before accepting live payments.

The application deploys as a single unit. On Vercel, the API routes become functions alongside the pages; set `DATABASE_URL` and the `AI_*` variables as server-side environment variables and run `bun run db:migrate` before rolling out a release that expects a new column.

Analysis and follow-up generation call the AI provider, so [the route handler](apps/web/src/app/api/[[...route]]/route.ts) sets `maxDuration = 300`. With fluid compute, waiting on the model is billed as idle rather than active CPU.

For a self-hosted container, the standalone image serves both the UI and the API:

```bash
docker build -f apps/web/Dockerfile -t wtfiwant-web .
```

Deploy close to PostgreSQL, expose it over HTTPS, and keep `AI_API_KEY` only in the runtime's secret store.

### Dokploy

[`docker-compose.dokploy.yml`](docker-compose.dokploy.yml) is the deployable stack: PostgreSQL, a one-shot `migrate` service, and the web container. It differs from the development [`docker-compose.yml`](docker-compose.yml) in that nothing is published to the host — Dokploy's proxy reaches `web` over the internal network — and the database password has no default, so a missing secret fails the deploy instead of silently standing up a well-known password.

Create an application in Dokploy, point it at this repository, choose **Docker Compose** with `docker-compose.dokploy.yml`, and set the environment:

| Variable | Required | Notes |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | yes | Deploy fails without it. |
| `AI_PROVIDER` | no | `local` is for template-only development. Production payments require `openai`. |
| `AI_API_KEY` | when `AI_PROVIDER=openai` | The API refuses to start otherwise. |
| `POSTGRES_DB`, `POSTGRES_USER` | no | Default to `wtfiwant`. |
| `AI_MODEL`, `AI_FOLLOWUP_MODEL` | no | Default to `gpt-6-luna`. |
| `PAYMENTS_ENABLED` | no | `false` keeps the deployment free-checkpoint-only. |
| `PUBLIC_APP_URL`, `STRIPE_*`, `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, `TERMS_URL`, `REFUND_POLICY_URL` | when payments are enabled | Checkout, webhook, report-delivery, and merchant-policy configuration. |

Add a domain pointing at the `web` service on port 3000. `DATABASE_URL` is assembled from the PostgreSQL variables, so it should not be set by hand.

To enable purchases, create a one-time Stripe Product/Price, configure a Stripe webhook destination at `https://YOUR_DOMAIN/api/stripe/webhook` for Checkout completion, delayed success/failure, and expiration events, verify the Resend sending domain, then set all payment/email variables from the table above. Leave `STRIPE_AUTOMATIC_TAX=false` until the merchant's registrations and product tax code are configured.

Run `mise exec -- bun run commerce:reconcile` with `DATABASE_URL` set to list paid purchases that are missing an analysis or report delivery. The output contains only purchase/session IDs and outcome codes—never answers or recipient email addresses.

Migrations run as their own service rather than from the web container's entrypoint: `web` depends on it with `service_completed_successfully`, so a release that expects a new column never serves traffic against the old schema, and a failed migration aborts the rollout. Reruns are idempotent — already-applied versions are skipped.

## Current MVP limitations

- Anonymous session URLs are bearer access: anyone with the UUID can open that reflection. Accounts and stronger per-session secrets are future work.
- The local provider is intentionally heuristic. It proves the private end-to-end flow but is not a substitute for evaluating production prompt quality.
- The safety classifier is deliberately conservative and minimal; it is a clear architecture seam, not a clinical moderation system.
- A Full Compass email cannot be recalled after delivery. Refund state is recorded for future policy automation, but refunds do not automatically revoke an already-delivered report.
- There are no recurring notifications, streaks, social features, subscriptions, public profiles, or generic chat.

### Report presentation and PDF

Emails and PDFs share one report content model. Evidence uses localized question wording, readable trade-offs, and a deduplicated numbered appendix; persistent question IDs remain internal. Original free text is quoted without translation. The paid Compass has a **Save as PDF** link, also included in the email. Resend delivery attaches the PDF directly as well. The PDF includes the latest saved action plan when downloaded, uses embedded OFL Noto fonts, and contains no private session URL. Download checks entitlement and safety status, and sends `private, no-store` headers. Downloads stop working after reflection deletion. Already downloaded files and delivered emails cannot be recalled.

### Umami analytics

The dashboard is hosted separately at https://analytics.awinter.dev. There is no
analytics admin screen or access key inside wtfiwant. Do **not** paste Umami's
standard script into the app: it would collect private reflection/report paths.
The browser sends a strict, finite event contract to `/api/analytics/events`;
the API forwards sanitized events to Umami's public `/api/send` endpoint after
responding, using Next's `after`. No Umami admin password or API key is needed.

#### Dokploy environment before deployment

Add these to the **wtfiwant service's Environment**, not the Umami service:

```dotenv
ANALYTICS_ENABLED=true
UMAMI_URL=https://analytics.awinter.dev
UMAMI_WEBSITE_ID=2b8b4183-f7a1-4d0d-9955-34c33ef3c196
ANALYTICS_HASH_SECRET=REPLACE_WITH_A_NEW_RANDOM_SECRET
PUBLIC_APP_URL=https://wtfiwant.app
```

Generate the hashing secret once with `openssl rand -hex 32`. Keep it stable on
redeploys so pending purchases retain attribution; it is separate from Umami's
APP_SECRET. Remove the former `ANALYTICS_ADMIN_TOKEN` if present. Compose passes
these variables at runtime; no `NEXT_PUBLIC_` variables or build arguments are
needed. Apply migrations through `0008_umami_outbox` (the Compose migrate service
runs automatically), then redeploy. An invalid optional configuration disables
analytics instead of breaking payments. `/api/analytics/config` should return
`{"enabled":true}`. Local `.env` is ignored by Git and is **not** uploaded to Dokploy.
Local `.env` disables analytics and needs no Umami credentials. Analytics also
requires `NODE_ENV=production`; loopback/localhost app URLs are rejected and the
browser skips collection on localhost, even if runtime settings enable it.

#### Events and reports

| Event | Meaning |
| --- | --- |
| Page view | Native Umami pageview for a finite page, e.g. `/de/result`; no private IDs |
| `reflection_started` | A new reflection was created |
| `question_01_viewed` … `question_07_viewed` | Question reached; numbers follow the form order |
| `question_01_answered` … `question_07_answered` | Answer saved successfully; no answer content |
| `reflection_completed` | Last free question finished |
| `checkpoint_viewed` | Free answer checkpoint shown |
| `checkout_clicked` | Purchase button clicked |
| `checkout_started` | Checkout created or first associated with this consenting visit |
| `checkout_cancelled` | Visitor returned through Stripe's cancellation link |
| `purchase` | Stripe payment independently verified by the server |
| `paid_refinement_viewed`, `paid_refinement_answered` | Optional paid question viewed/answered; finite position only |
| `generation_started`, `report_ready` | Generation requested / finished report opened in a consenting browser |
| `report_viewed` | Paid report shown |
| `pdf_download` | Website PDF link clicked; not proof of a completed download |
| `action_plan_saved` | Action plan saved successfully |
| `journey_error`, `checkout_error`, `report_error` | Technical failure; no error text or content |

In Umami, choose **the menu → Funnels**, then use events:
`reflection_started → reflection_completed → checkpoint_viewed → checkout_started → purchase → report_viewed`.
Create a second funnel using the question-view events to see where people stop.
Umami lists event names after it has received them; configure the production
funnel once the first production reflection has run after deployment.
Leaving a page is inferred from missing later milestones; closing a tab is not a
reliable event. A person can resume later. Use the UTM and Revenue insights for
campaigns and gross purchase amounts. Revenue is before fees/refunds, not a ledger.

Use stable, non-personal ad codes, for example:
`https://wtfiwant.app/de?utm_source=meta&utm_medium=paid_social&utm_campaign=launch_de&utm_content=video_a`.
Only these four UTM dimensions are accepted (letters, digits, `_` and `-`, max 64
characters). First-touch codes persist for the current analytics visit and are
included in native Umami UTM fields and conversion event data. Never put names,
emails or sensitive content in campaign codes. `fbclid`, other click IDs, search
terms, hashes, private session IDs and arbitrary URL parameters are discarded.
No Meta Pixel, Conversions API, session replay or answer recording is enabled.

Measurement starts only after consent and honours DNT/GPC. A random tab identifier
expires after 30 minutes of inactivity. Milestones deduplicate across reloads in
that visit; page views count navigation/reload. Counts describe consenting visits,
not unique people. To join browser milestones to server purchases without storing
IP addresses or browser fingerprints, the adapter uses a fixed local IP/transport
agent and passes the random visit ID. Therefore geography, browser and device
reports are intentionally unavailable; they must not be interpreted as visitor
measurements. Locale is measured. Infrastructure access logs are separate.

#### Delivery, withdrawal and operations

The app retains a small durable delivery outbox, not a second analytics dashboard.
Events/acknowledgement receipts expire after 7 days; hashed checkout attribution and
revocation markers after 30 days. New ingestion prunes at most hourly. Umami owns
longer-term history; configure its retention separately. Previous dashboard events
are not backfilled. A browser withdrawal removes queued events/checkout attribution,
blocks late writes and stops further measurement. It cannot recall an in-flight
request or erase already delivered Umami history. The notice states this explicitly.

Checkout/purchase writes are atomic and deduplicate verified conversion enqueueing
across Stripe webhooks and return-page polling. Network delivery runs separately
with a 1.5-second timeout and exponential backoff, up to 60 minutes. Row locks
prevent concurrent workers from delivering the same queued row. Like most HTTP
analytics delivery, a lost acknowledgement after Umami saves an event can produce
a duplicate on retry: Umami's ingestion API has no event-id idempotency guarantee.
Use the Stripe ledger as payment truth.

For recovery even when there is no subsequent traffic, schedule this command every
minute in the deployed environment with the same runtime variables and database
access (for a full repository/Bun checkout):

```bash
mise exec -- bun run --env-file=.env analytics:flush
```

It drains up to 100 due events and prunes expired local data. The production web
image includes the bundled maintenance command `bun /app/analytics-flush.js`.
Schedule that command every minute **inside the deployed web container**, with its
normal environment (e.g. your Dokploy task runner or host scheduler using Docker
exec). It requires no public maintenance endpoint or extra web credentials.
Monitor logs for `Umami event delivery delayed; retry queued`. Payment/report
delivery never waits for Umami's network.

Before activating paid campaigns, visit the production site with test UTM codes,
allow analytics and verify page views and question events in Umami Realtime. Run a
Stripe test-mode purchase against a separate test website, check one purchase and
its revenue, then switch back to production settings. Do not use a production card
charge merely to test analytics. Update the privacy notice for the actual operator
and any hosting changes before launch.
