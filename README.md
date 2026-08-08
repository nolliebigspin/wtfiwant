# whatthefuckiwant.app

A private, anonymous guided reflection for one difficult question: **What the fuck do I actually want?**

This is not a personality test, therapy app, happiness score, chatbot, or productivity tracker. It moves through **STOP → UNDERSTAND → START**: concrete memories, outside expectations, imagined lives, real trade-offs, an explicit Anti-Life, cautious pattern analysis, and one reversible real-world experiment.

## What is included

- Anonymous UUID sessions with server-side resume and cascade deletion
- A seven-chapter, one-screen-at-a-time reflection that works on mobile and desktop
- Data-defined questions and interaction types: text, choices, memories, Three Lives, trade-offs, and goals
- Replaceable AI providers with backend-only credentials, versioned prompts, strict output validation, and one repair attempt
- A credential-free local analysis provider for private development
- A pre-analysis safety layer that pauses ordinary motivational analysis for possible immediate self-harm danger
- Explainable Compass, Tensions, Anti-Life, possible directions, and evidence drawers tied to saved question IDs
- Direction → Experiment → Now planning and an editable If → Then intention
- Three development-only completed personas
- PostgreSQL migration, Docker Compose, production Dockerfiles, and behavior tests

## Architecture

```text
apps/
  web/       Next.js 16 App Router UI
  api/       Hono REST API, domain rules, AI, safety, PostgreSQL
packages/
  shared/    Zod contracts and assessment configuration
```

The web and API are separate deployable applications. The browser knows only `NEXT_PUBLIC_API_URL`; it never receives an AI or database credential.

Hono was chosen for the backend because its small Web-standard interface runs directly on Bun, is easy to exercise as HTTP in tests, and does not impose a second large application framework. PostgreSQL sits behind an `AssessmentRepository` seam. Production uses `PostgresAssessmentRepository`; tests use the same interface with an in-memory adapter. AI follows an equivalent `AIProvider` seam.

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

Start both applications:

```bash
mise exec -- bun run dev
```

Or start them separately:

```bash
mise exec -- bun run dev:api
mise exec -- bun run dev:web
```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:4000/health](http://localhost:4000/health).

To run PostgreSQL and the API in containers while keeping the web app local:

```bash
docker compose up --build
mise exec -- bun run dev:web
```

## Environment variables

| Variable | Used by | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `API_PORT` | API | REST server port; defaults to `4000` |
| `WEB_ORIGIN` | API | Allowed browser origin for CORS |
| `AI_PROVIDER` | API | `local` or `openai` |
| `AI_API_KEY` | API | Required only for `AI_PROVIDER=openai` |
| `AI_MODEL` | API | Structured analysis model |
| `AI_FOLLOWUP_MODEL` | API | Targeted follow-up model |
| `NEXT_PUBLIC_API_URL` | Web | Browser-visible API origin; never put secrets here |

`AI_PROVIDER=local` is the default. It sends no reflections to an external AI service and produces cautious deterministic hypotheses for development. To use OpenAI, set `AI_PROVIDER=openai` and provide a key plus models. The adapter uses the Responses API with Zod-backed structured output; all returned data is still validated locally before it can be stored or shown.

No reflection answer or assembled prompt is intentionally written to application logs. There are no tracking scripts or reflection analytics.

## Database and migrations

The initial migration is `apps/api/migrations/0001_initial.sql`. It creates:

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

## AI prompts and output

Prompts are not scattered through routes:

```text
apps/api/src/prompts/
  analysis.ts
  follow-up.ts
  action-plan.ts
```

`ANALYSIS_PROMPT_VERSION` is stored with every analysis. The strict Zod contract is `analysisSchema` in `packages/shared/src/schemas.ts`. Generated data must pass both structural validation and an evidence check proving every cited question ID exists in the submitted answers. Invalid output receives one repair attempt, then fails closed.

The current OpenAI adapter follows the official [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).

## Seed a completed reflection

In development, open `/commitment` and use one of the three development shortcuts:

1. Career-focused but burned out
2. Freedom-oriented but afraid of losing relationships
3. Stable life but unsure whether they want more adventure

Or call the development endpoint directly:

```bash
curl -X POST http://localhost:4000/dev/seed/burned_out
curl -X POST http://localhost:4000/dev/seed/freedom_relationships
curl -X POST http://localhost:4000/dev/seed/stable_adventure
```

The endpoints and UI shortcuts do not exist when `NODE_ENV=production`.

## Verification

```bash
mise exec -- bun run lint
mise exec -- bun run typecheck
mise exec -- bun test
mise exec -- bun run build
```

The backend tests exercise session creation, answer validation and restoration, structured-analysis repair, the safety state, invalid sessions, and deletion through HTTP/public interfaces. The frontend tests exercise restoration, required answers, save-before-navigation, analysis rendering, evidence disclosure, and action-plan persistence.

## Production deployment

Build each application independently from the repository root:

```bash
docker build -f apps/api/Dockerfile -t wtfiwant-api .
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t wtfiwant-web .
```

Deploy the API close to PostgreSQL, run migrations before API rollout, and expose it over HTTPS. Deploy the standalone Next.js image separately with its public API origin set at build time. Restrict `WEB_ORIGIN` to the real web origin. Keep `AI_API_KEY` only in the API runtime's secret store.

## Current MVP limitations

- Anonymous session URLs are bearer access: anyone with the UUID can open that reflection. Accounts and stronger per-session secrets are future work.
- The local provider is intentionally heuristic. It proves the private end-to-end flow but is not a substitute for evaluating production prompt quality.
- The safety classifier is deliberately conservative and minimal; it is a clear architecture seam, not a clinical moderation system.
- There is no payment provider. Every development session receives `assessment` and `full_analysis` entitlements behind the entitlement-shaped response.
- There are no notifications, streaks, analytics, social features, subscriptions, public profiles, or generic chat.
