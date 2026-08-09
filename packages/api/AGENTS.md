# API package guidance

- This is a library, not a server. `apps/web` mounts `createApp` in a Next route handler; nothing here may import from `next`.
- `createApp` takes a `basePath`. Next passes `/api`; tests use the `/` default so request paths match the route definitions.
- The REST interface is the test surface. Keep storage and AI adapters replaceable behind their existing seams.
- `migrations/` is applied by `bun run db:migrate`, which discovers files in sorted order. New migrations need no code change.
- Validate input before domain work and validate AI output before persistence or response.
- Never log answer bodies, generated prompts, or credentials. Errors returned to clients must not include stack traces.
- Migrations are append-only after release; cascading session deletion is a privacy invariant.
- Development seed endpoints must remain disabled when `NODE_ENV=production`.
