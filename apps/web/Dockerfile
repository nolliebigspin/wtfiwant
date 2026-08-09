FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
# Bun segfaults on teardown after `next build` completes (Bun 1.3.14), so the
# build runs under Node. Bun remains the runtime that serves the app.
RUN apk add --no-cache nodejs
COPY apps/web apps/web
COPY packages/api packages/api
COPY packages/shared packages/shared
RUN cd apps/web && node node_modules/.bin/next build

# Migrations run under Bun against the source tree: `migrate.ts` reads the SQL
# files with `Bun.file`, so the standalone output is the wrong shape for it.
FROM dependencies AS migrate
COPY packages/api packages/api
COPY packages/shared packages/shared
CMD ["bun", "packages/api/src/db/migrate.ts"]

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# The standalone server binds to localhost by default, which is unreachable
# from outside the container.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["bun", "apps/web/server.js"]
