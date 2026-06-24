# Architecture

**Analysis Date:** 2026-06-24

## Pattern Overview

**Overall:** Feature-Sliced Design (FSD) on Next.js 16 App Router

**Key Characteristics:**
- Thin route pages in `src/app/` delegate to feature modules in `src/features/`
- Server Components for initial data loading; Client Components for interactive UI
- Dual data-access pattern: Server Actions for SSR/page loads; REST API routes + React Query for client mutations and polling
- Role-based access control via NextAuth middleware and per-route guards

## Layers

**App (Routing):**
- Purpose: URL mapping, layout composition, auth gating at page level
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, `route.ts` (API handlers)
- Depends on: `features/`, `widgets/`, `shared/lib/session`, `shared/lib/auth`
- Used by: Browser navigation, middleware

**Widgets:**
- Purpose: Composite layout shells that span multiple features
- Location: `src/widgets/`
- Contains: `app-shell/ui/AppShell.tsx` — sidebar navigation, user switcher, role-filtered menu
- Depends on: `features/auth/`, `entities/user`, `shared/ui/`
- Used by: `src/app/(dashboard)/layout.tsx`

**Features:**
- Purpose: End-to-end business capabilities (journal, auth, program admin, analytics, etc.)
- Location: `src/features/`
- Contains: `actions/` (server actions), `ui/` (components), `lib/` (feature logic), `model/` (hooks, Zustand stores)
- Depends on: `entities/`, `shared/`
- Used by: `app/` pages, `widgets/`

**Entities:**
- Purpose: Domain types and client-side data hooks for core models
- Location: `src/entities/`
- Contains: `model/types.ts`, `api/use-*.ts` (React Query hooks)
- Depends on: `shared/api` response shape, REST endpoints in `app/api/`
- Used by: `features/` UI and model layers

**Shared:**
- Purpose: Cross-cutting infrastructure — DB, auth, validation, UI primitives, providers
- Location: `src/shared/`
- Contains: `lib/` (prisma, auth, validations, business helpers), `ui/`, `providers/`, `api/` (response helpers)
- Depends on: `generated/prisma`, external packages
- Used by: All layers

**Database:**
- Purpose: Persistence layer for users, groups, program steps, sessions, completions
- Location: `prisma/schema.prisma`, `generated/prisma/`
- Contains: Prisma schema, migrations in `prisma/migrations/`, seed/import scripts in `prisma/`
- Depends on: PostgreSQL via `@prisma/adapter-pg`
- Used by: Server actions, API routes via `shared/lib/prisma.ts`

## Data Flow

**Journal Lesson (primary teacher workflow):**

1. Teacher navigates to `/journal/[studentId]` — Server Component in `src/app/(dashboard)/journal/[studentId]/page.tsx`
2. Page calls `requireRole('TEACHER')` then server action `getStudentLesson()` from `src/features/journal/actions/journal-actions.ts`
3. Server action queries Prisma, recalculates progress via `recalculateStudentStepIdx()`, returns lesson data
4. Data passed as props to client component `LessonPage` in `src/features/journal/ui/LessonPage.tsx`
5. `useLessonPage` hook (`src/features/journal/model/use-lesson-page.ts`) loads existing session via `useStudentSession` → `GET /api/sessions`
6. Teacher edits grades/attendance in Zustand store (`journal-store.ts`) as draft state
7. On save, `useCreateSession` → `POST /api/sessions` creates/updates Session + StepCompletions
8. API route recalculates `currentStepIdx`, calls `revalidatePath('/journal')`
9. React Query invalidates `['students']` and `['student-session']` caches

**Journal Student List:**

1. `/journal` page calls `getTeacherGroup()` server action, renders `StudentList`
2. `StudentList` uses `useStudents(groupId, date)` from `src/entities/student/api/use-students.ts`
3. Hook fetches `GET /api/students?groupId=&date=` — returns attendance/completion summary per student

**Admin Program Management:**

1. Admin pages in `src/app/(dashboard)/admin/program/` use server actions from `src/features/program-admin/actions/program-actions.ts`
2. Mutations use Prisma transactions directly (no REST API)
3. `revalidatePath()` called after create/update/delete of levels and steps
4. Step content edited via Tiptap editor, mapped to JSON blocks by `src/features/program-admin/lib/tiptap-mapper.ts`

**Authentication:**

1. User submits 6-digit code on `/login` via `LoginForm` → NextAuth Credentials provider
2. `authorize()` in `src/shared/lib/auth.ts` validates code against `User.code` in DB
3. JWT stores `role`, `teacherId`, `studentId` via callbacks in `src/shared/lib/auth.config.ts`
4. `middleware.ts` runs `authConfig.authorized` on every matched route — redirects unauthenticated users to `/login`, enforces role-route mapping

**State Management:**
- **Server state:** React Query (`@tanstack/react-query`) via hooks in `src/entities/*/api/`
- **Session draft state:** Zustand store `useJournalStore` in `src/features/journal/model/journal-store.ts` — holds in-progress step grades before save
- **Auth session:** NextAuth JWT via `useSession()` / `auth()` server function
- **Theme:** `next-themes` + custom `ThemeSettingsProvider` in `src/features/theme-settings/`

## Key Abstractions

**Server Actions:**
- Purpose: Type-safe server-side data fetching and mutations callable from Server/Client Components
- Examples: `src/features/journal/actions/journal-actions.ts`, `src/features/program-admin/actions/program-actions.ts`, `src/features/user-admin/actions/user-actions.ts`
- Pattern: `'use server'` directive at file top; call `requireRole()` / `requireRoles()` for auth; use `prisma` directly; return typed data or `null`

**REST API Routes:**
- Purpose: HTTP endpoints for client-side React Query hooks
- Examples: `src/app/api/sessions/route.ts`, `src/app/api/students/route.ts`, `src/app/api/step-completions/route.ts`
- Pattern: `auth()` check → role validation → Zod schema parse → Prisma query → `success()` / `error()` from `src/shared/api/index.ts`

**API Response Envelope:**
- Purpose: Consistent JSON shape for all API routes
- Location: `src/shared/api/index.ts`
- Pattern: `{ data: T | null, error: string | null }` with helpers `success`, `error`, `unauthorized`, `forbidden`, `notFound`, `serverError`

**Authorization Helpers:**
- Purpose: Reusable access checks for teacher-student relationships
- Examples: `src/shared/lib/authorize-student.ts`, `src/shared/lib/authorize-student-access.ts`, `src/shared/lib/group-access.ts`
- Pattern: Return `{ error: NextResponse }` or `{ student }` — used in API routes

**Session Guards:**
- Purpose: Page-level auth in Server Components
- Location: `src/shared/lib/session.ts`
- Pattern: `requireAuth()`, `requireRole('TEACHER')`, `requireRoles(['MANAGER', 'SUPER_ADMIN'])` — redirect to `/login` on failure

**Zod Validations:**
- Purpose: Input validation for API bodies and server action params
- Location: `src/shared/lib/validations/` — `session.ts`, `step.ts`, `step-completion.ts`, `level.ts`, `user.ts`, `student-progress.ts`
- Pattern: Export schema + inferred TypeScript types (e.g. `StepContent`, `ContentBlock`)

**Step Progress Engine:**
- Purpose: Track student advancement through multi-level Quran program
- Examples: `src/shared/lib/recalculate-step-progress.ts`, `src/shared/lib/step-completion.ts`, `src/shared/lib/step-offset.ts`
- Pattern: `currentStepIdx` is global offset across all levels; `recalculateStudentStepIdx()` runs after every completion change; auto-promotes student to next level when all steps passed

**Content Blocks:**
- Purpose: Structured step content (text, Arabic, images, lists)
- Schema: `src/shared/lib/validations/step.ts` — discriminated union `ContentBlock`
- Rendering: `src/features/program-admin/ui/BlockRenderer.tsx`, journal `StepContent` components

## Entry Points

**Root Redirect:**
- Location: `src/app/page.tsx`
- Triggers: Visit `/`
- Responsibilities: Redirect authenticated users to `/dashboard`, others to `/login`

**Middleware:**
- Location: `middleware.ts`
- Triggers: All routes except static assets, uploads, `api/auth`
- Responsibilities: JWT session validation, role-based route protection via `authConfig.authorized`

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Fonts (Mulish, Amiri, Cormorant), global CSS, wraps children in `Providers` from `src/shared/providers/index.tsx`

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: All routes under `(dashboard)` group
- Responsibilities: Session check, load switchable users, render `AppShell` with navigation

**NextAuth Handler:**
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: `GET/POST /api/auth/*`
- Responsibilities: Export `handlers` from `src/shared/lib/auth.ts`

**API Routes:**
- `src/app/api/students/route.ts` — student list for journal
- `src/app/api/sessions/route.ts` — session CRUD for lesson page
- `src/app/api/step-completions/route.ts` — completion list/delete
- `src/app/api/step-completions/[id]/route.ts` — single completion PATCH
- `src/app/api/uploads/route.ts` — file upload to `public/uploads/`

## Error Handling

**Strategy:** Layer-specific — API routes return JSON errors; pages use Next.js navigation helpers; server actions throw or return null

**Patterns:**
- API routes: Always return `NextResponse.json({ data, error })` — never throw to client; use `serverError()` for 500s with dev-only console logging
- Server actions: Return `null` for not-found/unauthorized (caller uses `notFound()`); throw `Error` for unexpected failures in switch-user flow
- Pages: `notFound()` from `next/navigation` when data is null; `redirect('/login')` via session guards
- Client hooks: Check `json.error` from API response, `throw new Error(json.error)` for React Query error state
- UI feedback: Ant Design `message` for save success/failure in `use-lesson-page.ts`

## Cross-Cutting Concerns

**Logging:** `console.error` in `serverError()` helper (`src/shared/api/index.ts`) — development only; no structured logging service

**Validation:** Zod schemas in `src/shared/lib/validations/` — parse at API route boundary and in server actions before Prisma calls

**Authentication:** NextAuth v5 Credentials provider with 6-digit numeric code; JWT strategy; session extended with `role`, `teacherId`, `studentId` via `next-auth.d.ts` module augmentation

**Authorization:** Three levels — (1) middleware route-prefix checks in `auth.config.ts`, (2) page-level `requireRole()` in Server Components, (3) API-level `auth()` + role check + resource ownership (teacher owns student's group)

**Caching:** React Query with query keys like `['students', groupId, date]`, `['student-session', studentId, date]`; Next.js `revalidatePath()` after mutations in API routes and server actions

**Internationalization:** Russian UI strings hardcoded; `lang="ru"` on `<html>`; Arabic font (Amiri) for Quranic content blocks

---

*Architecture analysis: 2026-06-24*
