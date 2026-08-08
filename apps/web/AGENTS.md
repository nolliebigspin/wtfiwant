# Web app guidance

- Read the matching Next.js 16 guide in `node_modules/next/dist/docs` before changing framework conventions.
- Keep pages server-rendered unless interactivity requires a narrow client module.
- The browser may orchestrate screens and optimistic saved feedback, but business rules, safety, AI, and persistence belong in `apps/api`.
- Question wording and validation come from `@wtfiwant/shared`; do not duplicate them in UI modules.
- Use semantic controls, visible focus states, and a single clear primary action per reflection screen.
- Never put answer content into URLs, analytics, or logs.
