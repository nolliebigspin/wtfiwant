# MVP implementation plan

## Architecture

This repository is a Bun workspace with three independently deployable modules:

- `apps/web`: Next.js 16 App Router UI. It renders the landing page, guided reflection, results, evidence, and action-plan builder. It calls the backend through a typed client and keeps only the opaque session UUID in local storage.
- `apps/api`: Hono REST server. It validates requests, owns session rules, safety classification, analysis orchestration, prompts, and persistence. Hono was chosen because it has a small Web-standard interface, first-class TypeScript support, and runs directly on Bun without a framework adapter.
- `packages/shared`: the stable seam between both applications: assessment configuration, Zod request/response schemas, and shared types.

The backend's `AssessmentRepository` interface hides storage behavior. Production uses PostgreSQL; tests use an in-memory adapter through the same interface. AI follows the same shape: `AIProvider` has OpenAI and deterministic local adapters. The local adapter enables private, credential-free development; OpenAI is opt-in.

## Database

The initial SQL migration creates UUID-keyed `assessment_sessions`, `assessment_answers`, `ai_followups`, `assessment_analyses`, and `action_plans`. Answers and analyses are JSONB. Child rows reference the anonymous session with `ON DELETE CASCADE`. Sessions include a nullable future `user_id`, so accounts can be attached later without changing the assessment records.

## Assessment configuration

Chapters and question screens are immutable data in `packages/shared/src/assessment.ts`. Each screen has an ID, chapter, interaction type, copy, options where applicable, and validation requirements. The web renderer switches on this discriminated union; adding a question does not require adding a route.

## AI and safety

Strict schemas in `packages/shared/src/schemas.ts` define analysis, follow-up, session, and action-plan payloads. The backend validates generated JSON and performs one repair attempt. Versioned prompts live under `apps/api/src/prompts`. A safety classifier runs before analysis; possible immediate self-harm language returns a dedicated safe state rather than motivational analysis.

## Delivery sequence

1. Establish shared contracts and test the backend's public HTTP behavior.
2. Add PostgreSQL migrations/repository and replaceable AI providers.
3. Build the landing, reflection, results, explainability, action, resume, and deletion flows.
4. Add development-only seed personas, container artifacts, documentation, and nested `AGENTS.md` guidance.
5. Run formatting, lint, type checks, tests, production builds, and a two-axis standards/spec review.
