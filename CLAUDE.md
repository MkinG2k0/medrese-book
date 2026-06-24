<!-- GSD:project-start source:PROJECT.md -->
## Project

**Электронный дневник медресе**

Веб-приложение для медресе: ведение журнала посещаемости и успеваемости учеников по программе изучения Корана. Учителя проводят уроки и выставляют оценки, менеджеры управляют программой и персоналом, ученики видят свой прогресс.

Текущий этап — развитие brownfield-системы по утверждённому бэклогу: поэтапное наращивание аналитики обучения, управления учениками и преподавателями, дополнительных заданий, замещений, отпусков, безопасности и коммуникаций.

**Core Value:** Учитель и менеджер видят реальный прогресс каждого ученика — что пройдено, сколько времени заняло обучение, где отстаёт — и могут вовремя вмешаться (допзадания, смена преподавателя, контроль нормативов).

### Constraints

- **Tech stack**: сохранить Next.js 16 + Prisma + PostgreSQL + FSD — миграция нецелесообразна
- **Architecture**: новые фичи в `src/features/`, следовать существующим паттернам server actions / API routes
- **Language**: UI и документация на русском
- **Roles**: существующая модель ролей; супер-админ вне чата
- **Data**: не ломать существующие сессии и completions; миграции через Prisma
- **Security**: закрыть известные уязвимости API (см. CONCERNS.md) в рамках фазы безопасности
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 6.0.3 — весь прикладной код в `src/`, API routes, server actions, Prisma-скрипты в `prisma/`
- TSX — React-компоненты в `src/app/`, `src/features/`, `src/widgets/`, `src/entities/`, `src/shared/`
- SQL — миграции Prisma в `prisma/migrations/`
- CSS — глобальные стили и Tailwind в `src/app/globals.css`
- JSON — seed/import-данные программы в `prisma/data/`
## Runtime
- Node.js >= 22.12 (задано в `package.json` → `engines.node`)
- Docker-образ: `node:22-bookworm-slim` (`Dockerfile`)
- pnpm 9 (активируется через `corepack` в `Dockerfile`)
- Lockfile: `pnpm-lock.yaml` (lockfileVersion 9.0)
## Frameworks
- Next.js 16.1.6 — full-stack фреймворк (App Router, API Routes, Server Actions, middleware)
- React 19.2.3 / React DOM 19.2.3 — UI-слой
- Ant Design 6.4.3 + `@ant-design/icons` — основная UI-библиотека (таблицы, формы, layout)
- Tailwind CSS 4 — utility-классы и design tokens
- next-themes 0.4.6 — управление темой (`src/shared/providers/theme-provider.tsx`, default `dark`)
- Google Fonts через `next/font/google` — Mulish, Amiri (арабский), Cormorant Garamond (`src/app/layout.tsx`)
- Prisma 7.8.0 + `@prisma/client` — ORM, схема в `prisma/schema.prisma`
- `@prisma/adapter-pg` + `pg` 8.16.3 — PostgreSQL driver adapter (Prisma 7 pattern)
- `@tanstack/react-query` 5.90.21 — клиентский кэш и мутации для REST API
- Zustand 5.0.14 — локальное UI-состояние журнала (`src/features/journal/model/journal-store.ts`)
- React Hook Form 7.71.2 + `@hookform/resolvers` 5.2.2 — формы (логин, админка)
- Zod 4.3.6 — валидация на клиенте и сервере (`src/shared/lib/validations/`, `src/shared/lib/auth.ts`)
- Tiptap 3.26.x (`@tiptap/react`, `starter-kit`, extensions) — редактор шагов программы
- Recharts 3.8.1 — графики аналитики (`src/features/analytics/ui/LevelStats.tsx`)
- NextAuth.js 5.0.0-beta.30 — JWT-сессии, credentials provider
- Playwright 1.61.0 — E2E-тесты
- ESLint 9 + `eslint-config-next` 16.1.6 — линтинг (`eslint.config.mjs`, FSD layer rules)
- tsx 4.20.5 — выполнение TypeScript-скриптов (seed, import, migrate helpers)
- dotenv 17.3.1 — загрузка env в Prisma config и e2e
## Key Dependencies
- `next` 16.1.6 — маршрутизация, SSR/RSC, API, сборка
- `@prisma/client` 7.8.0 + `prisma` 7.8.0 — доступ к PostgreSQL, миграции
- `next-auth` 5.0.0-beta.30 — авторизация и защита маршрутов
- `antd` 6.4.3 — основной UI kit
- `zod` 4.3.6 — единая схема валидации
- `pg` + `@prisma/adapter-pg` — подключение к PostgreSQL через Prisma driver adapter (`src/shared/lib/create-prisma-client.ts`)
- `sharp` 0.34.5 — оптимизация изображений Next.js (transitive dependency для `next/image`)
- `clsx` + `tailwind-merge` — утилита `cn()` в `src/shared/lib/utils.ts`
- `@aws-sdk/client-s3` — в `package.json`, импортов в `src/` и `prisma/` нет; загрузки идут в локальную ФС (`src/app/api/uploads/route.ts`)
- `sonner`, `lucide-react`, `react-day-picker`, `class-variance-authority` — в `package.json`, импортов в коде нет
- `dayjs` — Ant Design DatePicker в журнале
- `date-fns` — расчёты аналитики (`src/shared/lib/analytics.ts`)
## Configuration
- Основной конфиг: `.env` (gitignored, см. `.gitignore`)
- E2E-конфиг: `.env.test` (gitignored), шаблон: `.env.test.example`
- Prisma читает `DATABASE_URL` через `prisma.config.ts` (`import 'dotenv/config'`)
- README ссылается на `.env.example`, файл в репозитории не обнаружен
- `DATABASE_URL` — PostgreSQL connection string (обязателен для приложения и Prisma)
- `AUTH_SECRET` или `NEXTAUTH_SECRET` — секрет JWT NextAuth
- `NEXTAUTH_URL` / `AUTH_URL` — базовый URL приложения (production default в `src/app/robots.ts`: `https://toykhana.ru`)
- `next.config.ts` — Next.js (turbopack, image remotePatterns)
- `tsconfig.json` — TypeScript strict, path alias `@/*` → `./src/*`
- `prisma.config.ts` — Prisma 7 config (schema, migrations path, seed command)
- `Dockerfile` — multi-stage build (deps → builder → runner/migrator), pnpm, `prisma generate`, `next build`
- `docker-compose.yml` — локальный Postgres (profile `local-db`), app и migrator (profile `migrate`)
- Генерируется в `generated/prisma/` (`prisma/schema.prisma` → `output = "../generated/prisma"`)
- Реэкспорт: `src/shared/lib/db.ts` → `generated/prisma/client`
- Директория `/generated` в `.gitignore`; `postinstall` запускает `prisma generate`
## Platform Requirements
- Node.js >= 22.12
- pnpm (рекомендуется, lockfile присутствует)
- PostgreSQL (удалённый Neon по README или локальный через `docker compose --profile local-db up -d postgres`)
- Команды: `pnpm install`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`
- Docker-контейнер на базе `Dockerfile` (target `runner`, порт 3000)
- Отдельный migrator-образ (target `migrator`, `prisma migrate deploy`)
- Комментарий в `Dockerfile` указывает на Coolify healthcheck (curl)
- PostgreSQL: Neon (упомянут в `README.md`) или внешний managed Postgres
- Домен production: `toykhana.ru` (fallback в `src/app/robots.ts`)
- Feature-Sliced Design (FSD): `src/app`, `src/entities`, `src/features`, `src/widgets`, `src/shared`
- Server Actions для мутаций (`src/features/*/actions/`)
- REST API routes для части read/write операций (`src/app/api/`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React-компоненты: `PascalCase.tsx` — `src/features/auth/ui/LoginForm.tsx`, `src/features/journal/ui/StudentList.tsx`
- Server Actions: `*-actions.ts` в `actions/` — `src/features/journal/actions/journal-actions.ts`, `src/features/user-admin/actions/user-actions.ts`
- Хуки React Query: `use-*.ts` в `entities/*/api/` — `src/entities/student/api/use-students.ts`, `src/entities/session/api/use-sessions.ts`
- Кастомные хуки фич: `use-*.ts` в `model/` — `src/features/journal/model/use-lesson-page.ts`
- Утилиты и бизнес-логика: `kebab-case.ts` — `src/shared/lib/calendar-date.ts`, `src/features/journal/lib/lesson-step-states.ts`
- Zod-схемы: по домену в `src/shared/lib/validations/` — `user.ts`, `session.ts`, `step-completion.ts`
- API-роуты: `route.ts` в `src/app/api/<resource>/`
- Страницы App Router: `page.tsx`, `layout.tsx` в `src/app/`
- Экспортируемые функции: `camelCase` — `getTeacherGroup`, `loginWithCode`, `authorizeTeacherStudent`
- Server Actions именуются по действию: `createUsers`, `getStudentLesson`, `updateStudentProgress`
- Хуки: префикс `use` — `useStudents`, `useJournalStore`, `useLessonPage`
- Селекторы Zustand: `select*` — `selectSessionStepStates` в `src/features/journal/model/journal-store.ts`
- Хелперы валидации/парсинга: глагол + сущность — `parseStudentEntries`, `buildCreateUsersPayload` в `src/shared/lib/validations/user.ts`
- `camelCase` для переменных и параметров
- `SCREAMING_SNAKE_CASE` для констант верхнего уровня — `EMPTY_SESSION_COMPLETIONS`, `INITIAL_VISIBLE_STEPS`, `PASSING_GRADE` в `prisma/seed.ts`
- Prisma enum-значения: `SCREAMING_SNAKE_CASE` — `'TEACHER'`, `'PRESENT'`, `'LATE'`, `'ABSENT'`
- Тестовые константы: `TEST_CODES`, `TEST_USERS` в `e2e/helpers/codes.ts`
- Экспортируемые типы: `PascalCase` — `JournalStep`, `LoginResult`, `CreateSessionInput`, `StepGradeState`
- Props-компонентов: `ComponentNameProps` — `RoleGuardProps` в `src/shared/ui/RoleGuard.tsx`
- Zod-типы через `z.infer<typeof schema>` — `CreateUsersInput`, `UpdateStudentUserFormInput`
- Доменные типы сущностей: `src/entities/*/model/types.ts`, реэкспорт через `src/entities/user/index.ts`
## Code Style
- Prettier не настроен (файлов `.prettierrc`, `biome.json` нет)
- Два устойчивых стиля в кодовой базе:
- При добавлении кода **следуй стилю соседних файлов в той же папке/слое**, не смешивай стили в одном файле
- ESLint 9 flat config: `eslint.config.mjs`
- Базовые правила: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- TypeScript: `strict: true` в `tsconfig.json`
- Path alias: `@/*` → `./src/*`
- `src/shared/**` — нельзя импортировать из `@/features/*`, `@/widgets/*`
- `src/entities/**` — нельзя импортировать из `@/features/*`, `@/widgets/*`
- `src/features/**` — нельзя импортировать из `@/widgets/*`
- `src/app/**` — исключён из layer-ограничений (может импортировать всё)
## Import Organization
- `@/*` → `src/*` — единственный алиас, настроен в `tsconfig.json`
## Error Handling
- Используй хелперы из `src/shared/api/index.ts`: `success`, `created`, `error`, `unauthorized`, `forbidden`, `notFound`, `serverError`
- Формат ответа: `{ data: T | null, error: string | null }`
- Валидация входа: `schema.safeParse(body)` → `error(parsed.error.message)` при неудаче
- Авторизация: `auth()` → ранний return `unauthorized()` / `forbidden()`
- Бизнес-ошибки: `error("сообщение на русском", status?)`
- Неожиданные ошибки БД: `try/catch` → `serverError(err)`
- Авторизация в начале: `await requireRole('TEACHER')` или `await requireRoles(['SUPER_ADMIN', 'MANAGER'])` из `src/shared/lib/session.ts`
- Валидация: `schema.parse(input)` (бросает) или `safeParse` с возвратом результата
- Бизнес-ошибки: `throw new Error('сообщение на русском')` — `src/features/user-admin/actions/user-actions.ts`
- После мутаций: `revalidatePath('/journal')`, `revalidatePath(\`/journal/${studentId}\`)` — см. `src/app/api/sessions/route.ts`, `src/features/student-admin/actions/student-admin-actions.ts`
- Паттерн `{ ok: true } | { ok: false; error: string }` — `LoginResult` в `src/features/auth/actions/login-actions.ts`
- Клиент проверяет `result.ok` и показывает `result.error` в UI
- `await requireRole('TEACHER')` — редирект на `/login` при отсутствии сессии или неверной роли
- Пустые состояния: ранний return JSX с `<Text>` — `src/app/(dashboard)/journal/page.tsx`
- API: `authorizeTeacherStudent(studentId)` из `src/shared/lib/authorize-student.ts` — возвращает `{ error, student }`
- Проверяй `authResult.error` и делай ранний return
- В `queryFn`/`mutationFn`: `if (json.error) throw new Error(json.error)` — `src/entities/student/api/use-students.ts`
- Ошибки отображаются через Ant Design `message.error` или локальный `useState` — `src/features/journal/model/use-lesson-page.ts`, `src/features/auth/ui/LoginForm.tsx`
## Logging
- `console.error("[API Error]", err)` только в `serverError()` и только при `NODE_ENV === "development"` — `src/shared/api/index.ts`
- E2E setup: `console.log` для статуса seed — `e2e/global-setup.ts`
- Не добавляй `console.log` в production-код без необходимости
## Comments
- JSDoc для неочевидных хелперов E2E — `e2e/helpers/antd.ts` (`/** Клик по Ant Design Radio.Button... */`)
- Комментарии в ESLint config для объяснения layer rules — `eslint.config.mjs`
- Бизнес-логика должна быть самодокументируемой; inline-комментарии редки
- Не используется систематически
- Типы экспортируются через `export type` вместо JSDoc
## Function Design
- Server actions принимают `unknown` для внешнего ввода, затем парсят через Zod — `createUsers(input: unknown)`
- Типизированные параметры для внутренних вызовов — `getStudentLesson(studentId: string)`
- Server actions: данные Prisma напрямую, `null` при отсутствии/запрете доступа, или Result-объект
- API routes: всегда `NextResponse` через хелперы `success`/`error`
- Хуки React Query: типизированный generic `useQuery<Student[]>`
## Module Design
- Публичный API фичи через barrel `index.ts` — `src/features/theme-settings/index.ts`
- Shared barrel частичный — `src/shared/lib/index.ts` (только utils, site, useDebounce)
- Компоненты: именованный export `export function LoginForm()` или default re-export antd — `src/shared/ui/Title.tsx`
- Используются в `entities/*/index.ts` и `features/*/index.ts` для типов и публичных компонентов
- Не создавай глубокие barrel-цепочки; импортируй напрямую из `actions/`, `ui/`, `lib/` при работе внутри фичи
## Validation (Zod)
- Отдельные схемы для формы и API payload при разной структуре — `createUserFormSchema` + `createUsersSchema` + `buildCreateUsersPayload()` в `src/shared/lib/validations/user.ts`
- Сообщения об ошибках на русском: `z.string().min(2, 'Имя должно быть не короче 2 символов')`
- `.refine()` для кросс-полевой валидации (роль STUDENT → обязательны groupId, levelId)
- `z.infer<typeof schema>` для экспорта типов
- В server actions: `.parse()` для trusted internal calls; `.safeParse()` для user input в API и login
## UI Patterns
- `react-hook-form` + `@hookform/resolvers/zod` + `zodResolver(schema)`
- Ant Design inputs через `Controller` — `src/features/auth/ui/LoginForm.tsx`
- Локальный state для ошибок submit: `useState<string | null>(null)`
- Tailwind CSS через `cn()` из `src/shared/lib/utils.ts` (`clsx` + `tailwind-merge`)
- Ant Design theme через `src/shared/providers/antd-provider.tsx`
- Тонкие обёртки над antd: `src/shared/ui/Title.tsx`, `src/shared/ui/Text.tsx`
- `RoleGuard` для условного рендера по роли — `src/shared/ui/RoleGuard.tsx`
## State Management
- `queryKey`: массив строк — `['students', groupId, date]`, `['student-session', studentId, date]`
- `enabled` для условной загрузки
- `invalidateQueries` в `onSuccess` мутаций — `src/entities/session/api/use-sessions.ts`
- `create<StoreType>()` с селекторами — `src/features/journal/model/journal-store.ts`
- Экспортируй константы пустого состояния: `EMPTY_SESSION_COMPLETIONS`
## Server/Client Boundaries
## Localization
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Thin route pages in `src/app/` delegate to feature modules in `src/features/`
- Server Components for initial data loading; Client Components for interactive UI
- Dual data-access pattern: Server Actions for SSR/page loads; REST API routes + React Query for client mutations and polling
- Role-based access control via NextAuth middleware and per-route guards
## Layers
- Purpose: URL mapping, layout composition, auth gating at page level
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, `route.ts` (API handlers)
- Depends on: `features/`, `widgets/`, `shared/lib/session`, `shared/lib/auth`
- Used by: Browser navigation, middleware
- Purpose: Composite layout shells that span multiple features
- Location: `src/widgets/`
- Contains: `app-shell/ui/AppShell.tsx` — sidebar navigation, user switcher, role-filtered menu
- Depends on: `features/auth/`, `entities/user`, `shared/ui/`
- Used by: `src/app/(dashboard)/layout.tsx`
- Purpose: End-to-end business capabilities (journal, auth, program admin, analytics, etc.)
- Location: `src/features/`
- Contains: `actions/` (server actions), `ui/` (components), `lib/` (feature logic), `model/` (hooks, Zustand stores)
- Depends on: `entities/`, `shared/`
- Used by: `app/` pages, `widgets/`
- Purpose: Domain types and client-side data hooks for core models
- Location: `src/entities/`
- Contains: `model/types.ts`, `api/use-*.ts` (React Query hooks)
- Depends on: `shared/api` response shape, REST endpoints in `app/api/`
- Used by: `features/` UI and model layers
- Purpose: Cross-cutting infrastructure — DB, auth, validation, UI primitives, providers
- Location: `src/shared/`
- Contains: `lib/` (prisma, auth, validations, business helpers), `ui/`, `providers/`, `api/` (response helpers)
- Depends on: `generated/prisma`, external packages
- Used by: All layers
- Purpose: Persistence layer for users, groups, program steps, sessions, completions
- Location: `prisma/schema.prisma`, `generated/prisma/`
- Contains: Prisma schema, migrations in `prisma/migrations/`, seed/import scripts in `prisma/`
- Depends on: PostgreSQL via `@prisma/adapter-pg`
- Used by: Server actions, API routes via `shared/lib/prisma.ts`
## Data Flow
- **Server state:** React Query (`@tanstack/react-query`) via hooks in `src/entities/*/api/`
- **Session draft state:** Zustand store `useJournalStore` in `src/features/journal/model/journal-store.ts` — holds in-progress step grades before save
- **Auth session:** NextAuth JWT via `useSession()` / `auth()` server function
- **Theme:** `next-themes` + custom `ThemeSettingsProvider` in `src/features/theme-settings/`
## Key Abstractions
- Purpose: Type-safe server-side data fetching and mutations callable from Server/Client Components
- Examples: `src/features/journal/actions/journal-actions.ts`, `src/features/program-admin/actions/program-actions.ts`, `src/features/user-admin/actions/user-actions.ts`
- Pattern: `'use server'` directive at file top; call `requireRole()` / `requireRoles()` for auth; use `prisma` directly; return typed data or `null`
- Purpose: HTTP endpoints for client-side React Query hooks
- Examples: `src/app/api/sessions/route.ts`, `src/app/api/students/route.ts`, `src/app/api/step-completions/route.ts`
- Pattern: `auth()` check → role validation → Zod schema parse → Prisma query → `success()` / `error()` from `src/shared/api/index.ts`
- Purpose: Consistent JSON shape for all API routes
- Location: `src/shared/api/index.ts`
- Pattern: `{ data: T | null, error: string | null }` with helpers `success`, `error`, `unauthorized`, `forbidden`, `notFound`, `serverError`
- Purpose: Reusable access checks for teacher-student relationships
- Examples: `src/shared/lib/authorize-student.ts`, `src/shared/lib/authorize-student-access.ts`, `src/shared/lib/group-access.ts`
- Pattern: Return `{ error: NextResponse }` or `{ student }` — used in API routes
- Purpose: Page-level auth in Server Components
- Location: `src/shared/lib/session.ts`
- Pattern: `requireAuth()`, `requireRole('TEACHER')`, `requireRoles(['MANAGER', 'SUPER_ADMIN'])` — redirect to `/login` on failure
- Purpose: Input validation for API bodies and server action params
- Location: `src/shared/lib/validations/` — `session.ts`, `step.ts`, `step-completion.ts`, `level.ts`, `user.ts`, `student-progress.ts`
- Pattern: Export schema + inferred TypeScript types (e.g. `StepContent`, `ContentBlock`)
- Purpose: Track student advancement through multi-level Quran program
- Examples: `src/shared/lib/recalculate-step-progress.ts`, `src/shared/lib/step-completion.ts`, `src/shared/lib/step-offset.ts`
- Pattern: `currentStepIdx` is global offset across all levels; `recalculateStudentStepIdx()` runs after every completion change; auto-promotes student to next level when all steps passed
- Purpose: Structured step content (text, Arabic, images, lists)
- Schema: `src/shared/lib/validations/step.ts` — discriminated union `ContentBlock`
- Rendering: `src/features/program-admin/ui/BlockRenderer.tsx`, journal `StepContent` components
## Entry Points
- Location: `src/app/page.tsx`
- Triggers: Visit `/`
- Responsibilities: Redirect authenticated users to `/dashboard`, others to `/login`
- Location: `middleware.ts`
- Triggers: All routes except static assets, uploads, `api/auth`
- Responsibilities: JWT session validation, role-based route protection via `authConfig.authorized`
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Fonts (Mulish, Amiri, Cormorant), global CSS, wraps children in `Providers` from `src/shared/providers/index.tsx`
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: All routes under `(dashboard)` group
- Responsibilities: Session check, load switchable users, render `AppShell` with navigation
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: `GET/POST /api/auth/*`
- Responsibilities: Export `handlers` from `src/shared/lib/auth.ts`
- `src/app/api/students/route.ts` — student list for journal
- `src/app/api/sessions/route.ts` — session CRUD for lesson page
- `src/app/api/step-completions/route.ts` — completion list/delete
- `src/app/api/step-completions/[id]/route.ts` — single completion PATCH
- `src/app/api/uploads/route.ts` — file upload to `public/uploads/`
## Error Handling
- API routes: Always return `NextResponse.json({ data, error })` — never throw to client; use `serverError()` for 500s with dev-only console logging
- Server actions: Return `null` for not-found/unauthorized (caller uses `notFound()`); throw `Error` for unexpected failures in switch-user flow
- Pages: `notFound()` from `next/navigation` when data is null; `redirect('/login')` via session guards
- Client hooks: Check `json.error` from API response, `throw new Error(json.error)` for React Query error state
- UI feedback: Ant Design `message` for save success/failure in `use-lesson-page.ts`
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
