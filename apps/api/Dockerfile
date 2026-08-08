FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY apps/api apps/api
COPY packages/shared packages/shared
RUN bun run --cwd apps/api build

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/migrations ./apps/api/migrations
COPY --from=build /app/apps/api/src/db ./apps/api/src/db
COPY --from=build /app/packages/shared ./packages/shared
EXPOSE 4000
WORKDIR /app/apps/api
CMD ["bun", "run", "start:prod"]
