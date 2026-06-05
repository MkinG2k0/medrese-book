# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate

ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/dummy?sslmode=disable
ENV DATABASE_URL=$DATABASE_URL

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN mkdir -p src/shared/lib
COPY src/shared/lib/database-url.ts ./src/shared/lib/database-url.ts

RUN --mount=type=cache,id=pnpm-store-wedding,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

FROM base AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN mkdir -p src/shared/lib
COPY src/shared/lib/database-url.ts ./src/shared/lib/database-url.ts
COPY --from=deps /app/node_modules ./node_modules

ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/dummy?sslmode=disable
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production

COPY . .
RUN mkdir -p public

RUN --mount=type=cache,id=prisma-engines-wedding,target=/root/.cache/prisma \
  --mount=type=cache,id=next-cache-wedding,target=/app/.next/cache \
  pnpm exec prisma generate \
  && pnpm build

FROM base AS migrator
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN mkdir -p src/shared/lib
COPY src/shared/lib/database-url.ts ./src/shared/lib/database-url.ts
COPY --from=deps /app/node_modules ./node_modules

ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/dummy?sslmode=disable
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Coolify healthcheck uses curl/wget; bookworm-slim omits both
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
