# Shared package guidance

- This package contains only serializable contracts, schemas, and assessment configuration shared by web and API.
- Keep schemas strict and infer TypeScript types from Zod rather than maintaining parallel interfaces.
- Question IDs are persisted evidence references: never rename a released ID without a migration strategy.
- Do not import framework, database, browser, or Node-specific modules here.
