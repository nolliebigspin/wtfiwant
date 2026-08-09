# Web app guidance

- Read the matching Next.js 16 guide in `node_modules/next/dist/docs` before changing framework conventions.
- Keep pages server-rendered unless interactivity requires a narrow client module.
- The browser may orchestrate screens and optimistic saved feedback, but business rules, safety, AI, and persistence belong in `packages/api`.
- The API is mounted at `src/app/api/[[...route]]/route.ts`. Keep that file a thin adapter: construct dependencies lazily (Next evaluates route modules at build time, before `DATABASE_URL` exists) and let the Hono app own routing.
- `DATABASE_URL` and `AI_API_KEY` are server-only. Never expose them through `NEXT_PUBLIC_*` or a client component.
- Question wording and validation come from `@wtfiwant/shared`; do not duplicate them in UI modules.
- Use semantic controls, visible focus states, and a single clear primary action per reflection screen.
- Never put answer content into URLs, analytics, or logs.
