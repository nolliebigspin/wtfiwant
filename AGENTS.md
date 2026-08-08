<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository guidance

- This is a Bun workspace monorepo. Run Bun only through `mise exec -- bun`.
- `apps/web` is presentation and browser orchestration; domain contracts and question data belong in `packages/shared`.
- `apps/api` owns persistence, safety checks, AI calls, prompts, and business rules.
- Never log reflection answers, assembled prompts, or AI credentials.
- Validate every request and every AI-generated payload with the shared Zod schemas.
- Prefer behavior tests at public seams. Run `mise exec -- bun run typecheck`, `test`, `lint`, and `build` before handoff.
