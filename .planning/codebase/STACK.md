# Technology Stack

**Analysis Date:** 2026-06-24

## Languages

**Primary:**
- TypeScript 6.0.3 — весь прикладной код в `src/`, API routes, server actions, Prisma-скрипты в `prisma/`
- TSX — React-компоненты в `src/app/`, `src/features/`, `src/widgets/`, `src/entities/`, `src/shared/`

**Secondary:**
- SQL — миграции Prisma в `prisma/migrations/`
- CSS — глобальные стили и Tailwind в `src/app/globals.css`
- JSON — seed/import-данные программы в `prisma/data/`

## Runtime

**Environment:**
- Node.js >= 22.12 (задано в `package.json` → `engines.node`)
- Docker-образ: `node:22-bookworm-slim` (`Dockerfile`)

**Package Manager:**
- pnpm 9 (активируется через `corepack` в `Dockerfile`)
- Lockfile: `pnpm-lock.yaml` (lockfileVersion 9.0)

## Frameworks

**Core:**
- Next.js 16.1.6 — full-stack фреймворк (App Router, API Routes, Server Actions, middleware)
  - Конфиг: `next.config.ts` (Turbopack в dev, remote images для Wikimedia)
  - Entry layout: `src/app/layout.tsx`
  - Auth middleware: `middleware.ts`
- React 19.2.3 / React DOM 19.2.3 — UI-слой

**UI & Styling:**
- Ant Design 6.4.3 + `@ant-design/icons` — основная UI-библиотека (таблицы, формы, layout)
  - Провайдер: `src/shared/providers/antd-provider.tsx` (русская локаль, dark theme)
- Tailwind CSS 4 — utility-классы и design tokens
  - PostCSS: `postcss.config.mjs` (`@tailwindcss/postcss`)
  - Стили: `src/app/globals.css` (`@import "tailwindcss"`, `tw-animate-css`)
- next-themes 0.4.6 — управление темой (`src/shared/providers/theme-provider.tsx`, default `dark`)
- Google Fonts через `next/font/google` — Mulish, Amiri (арабский), Cormorant Garamond (`src/app/layout.tsx`)

**Data & State:**
- Prisma 7.8.0 + `@prisma/client` — ORM, схема в `prisma/schema.prisma`
- `@prisma/adapter-pg` + `pg` 8.16.3 — PostgreSQL driver adapter (Prisma 7 pattern)
- `@tanstack/react-query` 5.90.21 — клиентский кэш и мутации для REST API
  - Провайдер: `src/shared/providers/query-provider.tsx`
- Zustand 5.0.14 — локальное UI-состояние журнала (`src/features/journal/model/journal-store.ts`)

**Forms & Validation:**
- React Hook Form 7.71.2 + `@hookform/resolvers` 5.2.2 — формы (логин, админка)
- Zod 4.3.6 — валидация на клиенте и сервере (`src/shared/lib/validations/`, `src/shared/lib/auth.ts`)

**Rich Text & Charts:**
- Tiptap 3.26.x (`@tiptap/react`, `starter-kit`, extensions) — редактор шагов программы
  - Реализация: `src/features/program-admin/ui/editor/`
- Recharts 3.8.1 — графики аналитики (`src/features/analytics/ui/LevelStats.tsx`)

**Auth:**
- NextAuth.js 5.0.0-beta.30 — JWT-сессии, credentials provider
  - Конфиг: `src/shared/lib/auth.ts`, `src/shared/lib/auth.config.ts`
  - Route handler: `src/app/api/auth/[...nextauth]/route.ts`

**Testing:**
- Playwright 1.61.0 — E2E-тесты
  - Конфиг: `playwright.config.ts`
  - Тесты: `e2e/`
  - Global setup (seed БД): `e2e/global-setup.ts`

**Build/Dev:**
- ESLint 9 + `eslint-config-next` 16.1.6 — линтинг (`eslint.config.mjs`, FSD layer rules)
- tsx 4.20.5 — выполнение TypeScript-скриптов (seed, import, migrate helpers)
- dotenv 17.3.1 — загрузка env в Prisma config и e2e

## Key Dependencies

**Critical:**
- `next` 16.1.6 — маршрутизация, SSR/RSC, API, сборка
- `@prisma/client` 7.8.0 + `prisma` 7.8.0 — доступ к PostgreSQL, миграции
- `next-auth` 5.0.0-beta.30 — авторизация и защита маршрутов
- `antd` 6.4.3 — основной UI kit
- `zod` 4.3.6 — единая схема валидации

**Infrastructure:**
- `pg` + `@prisma/adapter-pg` — подключение к PostgreSQL через Prisma driver adapter (`src/shared/lib/create-prisma-client.ts`)
- `sharp` 0.34.5 — оптимизация изображений Next.js (transitive dependency для `next/image`)
- `clsx` + `tailwind-merge` — утилита `cn()` в `src/shared/lib/utils.ts`

**Declared but not used in source (as of analysis):**
- `@aws-sdk/client-s3` — в `package.json`, импортов в `src/` и `prisma/` нет; загрузки идут в локальную ФС (`src/app/api/uploads/route.ts`)
- `sonner`, `lucide-react`, `react-day-picker`, `class-variance-authority` — в `package.json`, импортов в коде нет

**Date utilities:**
- `dayjs` — Ant Design DatePicker в журнале
- `date-fns` — расчёты аналитики (`src/shared/lib/analytics.ts`)

## Configuration

**Environment:**
- Основной конфиг: `.env` (gitignored, см. `.gitignore`)
- E2E-конфиг: `.env.test` (gitignored), шаблон: `.env.test.example`
- Prisma читает `DATABASE_URL` через `prisma.config.ts` (`import 'dotenv/config'`)
- README ссылается на `.env.example`, файл в репозитории не обнаружен

**Key configs required:**
- `DATABASE_URL` — PostgreSQL connection string (обязателен для приложения и Prisma)
- `AUTH_SECRET` или `NEXTAUTH_SECRET` — секрет JWT NextAuth
- `NEXTAUTH_URL` / `AUTH_URL` — базовый URL приложения (production default в `src/app/robots.ts`: `https://toykhana.ru`)

**Build:**
- `next.config.ts` — Next.js (turbopack, image remotePatterns)
- `tsconfig.json` — TypeScript strict, path alias `@/*` → `./src/*`
- `prisma.config.ts` — Prisma 7 config (schema, migrations path, seed command)
- `Dockerfile` — multi-stage build (deps → builder → runner/migrator), pnpm, `prisma generate`, `next build`
- `docker-compose.yml` — локальный Postgres (profile `local-db`), app и migrator (profile `migrate`)

**Prisma client output:**
- Генерируется в `generated/prisma/` (`prisma/schema.prisma` → `output = "../generated/prisma"`)
- Реэкспорт: `src/shared/lib/db.ts` → `generated/prisma/client`
- Директория `/generated` в `.gitignore`; `postinstall` запускает `prisma generate`

## Platform Requirements

**Development:**
- Node.js >= 22.12
- pnpm (рекомендуется, lockfile присутствует)
- PostgreSQL (удалённый Neon по README или локальный через `docker compose --profile local-db up -d postgres`)
- Команды: `pnpm install`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`

**Production:**
- Docker-контейнер на базе `Dockerfile` (target `runner`, порт 3000)
- Отдельный migrator-образ (target `migrator`, `prisma migrate deploy`)
- Комментарий в `Dockerfile` указывает на Coolify healthcheck (curl)
- PostgreSQL: Neon (упомянут в `README.md`) или внешний managed Postgres
- Домен production: `toykhana.ru` (fallback в `src/app/robots.ts`)

**Architecture pattern:**
- Feature-Sliced Design (FSD): `src/app`, `src/entities`, `src/features`, `src/widgets`, `src/shared`
- Server Actions для мутаций (`src/features/*/actions/`)
- REST API routes для части read/write операций (`src/app/api/`)

---

*Stack analysis: 2026-06-24*
