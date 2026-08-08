# API app guidance

- The REST interface is the test surface. Keep storage and AI adapters replaceable behind their existing seams.
- Validate input before domain work and validate AI output before persistence or response.
- Never log answer bodies, generated prompts, or credentials. Errors returned to clients must not include stack traces.
- Migrations are append-only after release; cascading session deletion is a privacy invariant.
- Development seed endpoints must remain disabled when `NODE_ENV=production`.
