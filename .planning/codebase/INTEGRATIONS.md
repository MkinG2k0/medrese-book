# External Integrations

**Analysis Date:** 2026-06-24

## APIs & External Services

**Authentication (custom credentials):**
- NextAuth.js v5 — внутренняя авторизация по 6-значному коду из БД
  - SDK/Client: `next-auth` 5.0.0-beta.30
  - Implementation: `src/shared/lib/auth.ts` (Credentials provider `code`), `src/shared/lib/auth.config.ts` (JWT, role-based route guards)
  - Route: `src/app/api/auth/[...nextauth]/route.ts`
  - Auth env: `AUTH_SECRET` или `NEXTAUTH_SECRET`, `NEXTAUTH_URL` / `AUTH_URL`

**Remote images (read-only):**
- Wikimedia Commons — внешние изображения для `next/image`
  - Config: `next.config.ts` → `images.remotePatterns` (`upload.wikimedia.org`)
  - Не требует API-ключа

**Google Fonts:**
- `next/font/google` — Mulish, Amiri, Cormorant Garamond
  - Implementation: `src/app/layout.tsx`
  - Загрузка шрифтов через Next.js при сборке/рантайме (без отдельного API-ключа)

**Internal REST API (same-origin):**
- Клиентские fetch-запросы к собственным Next.js API routes:
  - `src/app/api/sessions/route.ts` — сессии журнала
  - `src/app/api/students/route.ts` — список учеников
  - `src/app/api/step-completions/route.ts`, `src/app/api/step-completions/[id]/route.ts` — оценки шагов
  - `src/app/api/uploads/route.ts` — загрузка файлов
  - React Query hooks: `src/entities/session/api/use-sessions.ts`, `src/entities/student/api/use-students.ts`, `src/entities/step-completion/api/use-step-completions.ts`

**AWS S3:**
- Пакет `@aws-sdk/client-s3` объявлен в `package.json`, но интеграция в коде не обнаружена
- Фактическое хранилище файлов — локальная ФС (см. File Storage)

**Not detected:**
- Stripe, Supabase, Redis, Sentry, Telegram, email/SMS-провайдеры, OAuth-провайдеры (Google/GitHub и т.д.)

## Data Storage

**Databases:**
- PostgreSQL 16
  - Production: Neon (упомянут в `README.md`)
  - Local dev: Docker Compose profile `local-db` — `docker-compose.yml` (image `postgres:16-alpine`, порт 5432)
  - Connection: `DATABASE_URL` (читается в `prisma.config.ts`, `src/shared/lib/create-prisma-client.ts`, seed/import-скриптах)
  - Client: Prisma 7 с `@prisma/adapter-pg` + `pg`
  - Schema: `prisma/schema.prisma` (модели User, Teacher, Student, Group, Level, Step, Session, StepCompletion, Award)
  - Migrations: `prisma/migrations/` (5 миграций + `migration_lock.toml`)
  - Seed: `prisma/seed.ts` (`pnpm db:seed`)

**File Storage:**
- Local filesystem — загрузки в `public/uploads/`
  - Implementation: `src/app/api/uploads/route.ts` (`node:fs/promises`, `mkdir`, `writeFile`)
  - URL pattern: `/uploads/{timestamp}-{filename}`
  - Middleware исключает `/uploads` из auth matcher (`middleware.ts`)
- Seed/import JSON: `prisma/data/level1-page*.json`
- DOCX import (dev tooling): `prisma/lib/parse-level1-docx.ts` читает локальные `.docx` (env `LEVEL1_DOCX_DIR`, default Windows path)

**Caching:**
- None (внешний Redis/Memcached не используется)
- Клиентский кэш: TanStack React Query (`staleTime: 5 min` в `src/shared/providers/query-provider.tsx`)
- Next.js `revalidatePath` для инвалидации server-rendered данных в API routes

## Authentication & Identity

**Auth Provider:**
- Custom credentials через NextAuth v5 (не внешний IdP)
  - Flow: пользователь вводит 6-значный код → `prisma.user.findUnique({ where: { code } })` → JWT session
  - Roles: `SUPER_ADMIN`, `MANAGER`, `TEACHER`, `STUDENT` (enum в `prisma/schema.prisma`)
  - Session strategy: JWT (`authConfig.session.strategy: 'jwt'` в `src/shared/lib/auth.config.ts`)
  - Route protection: middleware (`middleware.ts`) + `authorized` callback в `auth.config.ts`
  - Client session: `SessionProvider` в `src/shared/providers/session-provider.tsx`, `useSession` в UI

**Impersonation / user switch (dev/admin only):**
- `src/features/auth/actions/switch-user-actions.ts`, `src/features/auth/lib/can-switch-user.ts`
  - Разрешено в `development` или для ролей `SUPER_ADMIN` / `MANAGER`

**API authorization pattern:**
- Server: `auth()` из `src/shared/lib/auth.ts` в API routes и server actions
- Helpers: `src/shared/lib/authorize-student.ts`, `src/shared/lib/group-access.ts`
- Response helpers: `src/shared/api/index.ts` (`unauthorized`, `forbidden`, `notFound`)

## Monitoring & Observability

**Error Tracking:**
- None (Sentry, Datadog и аналоги не подключены)

**Logs:**
- `console.error` в dev для API-ошибок (`src/shared/api/index.ts` → `serverError`)
- Playwright reporter: list + HTML report (`playwright.config.ts`)
- E2E global setup логирует seed-попытки (`e2e/global-setup.ts`)

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment (`Dockerfile`, `docker-compose.yml`)
- Coolify (упомянут в комментарии `Dockerfile` — healthcheck через curl)
- Production domain fallback: `https://toykhana.ru` (`src/app/robots.ts`)
- `.vercel` в `.gitignore` — возможное использование Vercel, активной конфигурации не обнаружено

**CI Pipeline:**
- None — директория `.github/` не обнаружена
- Playwright поддерживает CI-режим: `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0` (`playwright.config.ts`)

**Database migrations in deploy:**
- Docker target `migrator`: `pnpm exec prisma migrate deploy` (`Dockerfile`)
- Compose service `db-migrate` (profile `migrate`) в `docker-compose.yml`

## Environment Configuration

**Required env vars:**

| Variable | Purpose | Used in |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `prisma.config.ts`, `src/shared/lib/create-prisma-client.ts`, seed/import scripts |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | JWT signing secret | `src/shared/lib/auth.config.ts`, `playwright.config.ts` |
| `NEXTAUTH_URL` / `AUTH_URL` | Base URL for auth callbacks | `playwright.config.ts`, `src/app/robots.ts` |

**Optional / environment-specific:**

| Variable | Purpose | Used in |
|----------|---------|---------|
| `NODE_ENV` | development/production | Prisma singleton, API error logging, user switch |
| `PLAYWRIGHT_PORT` | E2E dev server port (default 3001) | `playwright.config.ts` |
| `PLAYWRIGHT_BASE_URL` | E2E base URL override | `playwright.config.ts` |
| `E2E_SKIP_SEED` | Skip DB seed before e2e (`1`) | `e2e/global-setup.ts` |
| `LEVEL1_DOCX_DIR` | Path to DOCX files for import scripts | `prisma/lib/parse-level1-docx.ts` |
| `CI` | CI mode for Playwright | `playwright.config.ts` |
| `PORT` | App port (E2E sets via Playwright webServer) | Playwright webServer env |

**Secrets location:**
- `.env` — основной runtime (gitignored)
- `.env.test` — E2E и тестовая БД (gitignored); шаблон: `.env.test.example`
- Docker: `env_file: .env` в `docker-compose.yml` для сервисов `app` и `db-migrate`
- Build-time dummy `DATABASE_URL` в `Dockerfile` ARG для `prisma generate` / `next build`

**Note:** `src/shared/lib/database-url.ts` копируется в Docker build (`Dockerfile`), но файл отсутствует в рабочей копии репозитория — возможная незавершённая миграция конфигурации.

## Webhooks & Callbacks

**Incoming:**
- None — нет webhook endpoints для внешних сервисов
- Единственные входящие HTTP handlers: Next.js API routes и NextAuth (`/api/auth/*`)

**Outgoing:**
- None к внешним сервисам
- Исходящие `fetch()` только на same-origin API (`/api/sessions`, `/api/students`, `/api/step-completions`, `/api/uploads`)
- Server Actions вызывают Prisma напрямую без внешних HTTP-запросов

## Integration Patterns (prescriptive)

**Adding a new external service:**
1. Добавить SDK в `package.json`, конфигурировать через env в `.env` (не коммитить)
2. Создать клиент-обёртку в `src/shared/lib/` (по аналогии с `create-prisma-client.ts`)
3. Вызывать только из server actions (`src/features/*/actions/`) или API routes (`src/app/api/`)
4. Не импортировать секреты в client components (`"use client"`)

**Database access:**
- Использовать `prisma` из `src/shared/lib/prisma.ts` (singleton с hot-reload в dev)
- Новые таблицы — через `prisma/schema.prisma` + `pnpm db:migrate`

**File uploads:**
- Текущий паттерн — локальная ФС в `public/uploads/`; для S3 потребуется заменить логику в `src/app/api/uploads/route.ts` и настроить env (bucket, credentials)

---

*Integration audit: 2026-06-24*
