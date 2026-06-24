# Codebase Structure

**Analysis Date:** 2026-06-24

## Directory Layout

```
medrese-book/
├── src/
│   ├── app/                    # Next.js App Router — routes and API
│   │   ├── (auth)/             # Unauthenticated routes (login)
│   │   ├── (dashboard)/        # Authenticated app with AppShell layout
│   │   ├── (main)/             # Empty route group (reserved, no pages)
│   │   └── api/                # REST API route handlers
│   ├── entities/               # Domain entities — types + React Query hooks
│   ├── features/               # Business features — actions, ui, lib, model
│   ├── widgets/                # Composite UI (app shell)
│   ├── shared/                 # Cross-cutting lib, ui, providers, api helpers
│   └── types/                  # Global TypeScript declarations
├── prisma/                     # Schema, migrations, seed, import scripts
├── generated/prisma/           # Prisma Client output (generated, committed)
├── e2e/                        # Playwright end-to-end tests
├── public/                     # Static assets, uploaded files at public/uploads/
├── middleware.ts               # NextAuth middleware
├── next.config.ts              # Next.js configuration
├── prisma.config.ts            # Prisma 7 config (schema path, migrations, datasource)
├── playwright.config.ts        # E2E test configuration
├── docker-compose.yml          # Production app + optional local Postgres
├── Dockerfile                  # Multi-stage build (app + migrator targets)
└── package.json                # pnpm scripts and dependencies
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js routing layer — maps URLs to pages and API handlers
- Contains: `page.tsx`, `layout.tsx`, `route.ts`, `globals.css`, `robots.ts`
- Key files: `src/app/layout.tsx` (root), `src/app/(dashboard)/layout.tsx` (authenticated shell), `src/app/page.tsx` (root redirect)

**`src/app/(auth)/`:**
- Purpose: Public authentication routes
- Contains: `login/page.tsx` — renders `LoginForm` without AppShell
- Key files: `src/app/(auth)/login/page.tsx`

**`src/app/(dashboard)/`:**
- Purpose: All authenticated application pages wrapped in AppShell
- Contains: Feature-specific route folders — `journal/`, `groups/`, `analytics/`, `admin/`, `student/`, `students/`
- Key files: `src/app/(dashboard)/layout.tsx`

**`src/app/api/`:**
- Purpose: REST endpoints consumed by React Query hooks
- Contains: `auth/`, `sessions/`, `students/`, `step-completions/`, `uploads/`
- Key files: `src/app/api/sessions/route.ts`, `src/app/api/students/route.ts`

**`src/entities/`:**
- Purpose: Thin domain layer — shared types and client data-fetching hooks
- Contains: `user/`, `student/`, `session/`, `step/`, `step-completion/` — each with `model/` and/or `api/`
- Key files: `src/entities/student/api/use-students.ts`, `src/entities/session/api/use-sessions.ts`, `src/entities/user/model/types.ts`

**`src/features/`:**
- Purpose: Self-contained business features with full vertical slice
- Contains: 10 feature modules — `auth`, `journal`, `groups`, `analytics`, `program-admin`, `user-admin`, `student-admin`, `student-portal`, `awards`, `theme-settings`
- Key files: Each feature follows `actions/`, `ui/`, `lib/`, `model/` subfolders

**`src/widgets/`:**
- Purpose: Large composite components spanning features
- Contains: `app-shell/` — navigation sidebar, header, user switcher
- Key files: `src/widgets/app-shell/ui/AppShell.tsx`, `src/widgets/app-shell/index.ts`

**`src/shared/`:**
- Purpose: Infrastructure shared across all layers
- Contains: `lib/` (prisma, auth, validations, business logic), `ui/` (primitives), `providers/` (React context), `api/` (response helpers)
- Key files: `src/shared/lib/prisma.ts`, `src/shared/lib/auth.ts`, `src/shared/lib/session.ts`, `src/shared/providers/index.tsx`

**`prisma/`:**
- Purpose: Database schema, migrations, seeding, content import utilities
- Contains: `schema.prisma`, `migrations/`, `seed.ts`, `import-*.ts`, `lib/` (docx parsers)
- Key files: `prisma/schema.prisma`, `prisma/seed.ts`

**`e2e/`:**
- Purpose: Playwright end-to-end tests by role/feature
- Contains: `auth.spec.ts`, `journal.spec.ts`, `admin.spec.ts`, `student.spec.ts`, `helpers/`
- Key files: `e2e/global-setup.ts`, `e2e/helpers/auth.ts`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Root redirect to login or dashboard
- `middleware.ts`: Auth middleware for all non-static routes
- `src/app/layout.tsx`: Root HTML layout with font loading and Providers
- `src/app/(dashboard)/layout.tsx`: Authenticated layout with AppShell
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth HTTP handler

**Configuration:**
- `package.json`: Scripts (`dev`, `build`, `db:*`, `test:e2e`), dependencies
- `tsconfig.json`: Path alias `@/*` → `./src/*`
- `next.config.ts`: Turbopack, remote image patterns
- `prisma.config.ts`: Prisma 7 schema/migration/seed config
- `eslint.config.mjs`: ESLint with `eslint-config-next`
- `playwright.config.ts`: E2E test runner config
- `.env.example`, `.env.test.example`: Environment variable templates (existence only)

**Core Logic:**
- `src/shared/lib/prisma.ts`: Singleton Prisma client
- `src/shared/lib/auth.ts`: NextAuth setup with Credentials provider
- `src/shared/lib/auth.config.ts`: JWT callbacks, role-based route authorization
- `src/shared/lib/recalculate-step-progress.ts`: Student advancement logic
- `src/shared/lib/step-completion.ts`: Grade evaluation, lesson step building
- `src/features/journal/actions/journal-actions.ts`: Teacher journal server actions
- `src/features/program-admin/actions/program-actions.ts`: Level/step CRUD server actions

**Testing:**
- `e2e/*.spec.ts`: Role-based E2E test suites
- `e2e/global-setup.ts`: DB seed before test run
- `e2e/helpers/`: Auth helpers, Ant Design selectors, test env loader

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- API handlers: `route.ts` (Next.js convention)
- Server actions: `*-actions.ts` in `features/*/actions/` (e.g. `journal-actions.ts`, `user-actions.ts`)
- React Query hooks: `use-*.ts` in `entities/*/api/` (e.g. `use-students.ts`, `use-sessions.ts`)
- UI components: PascalCase `.tsx` (e.g. `LessonPage.tsx`, `StudentList.tsx`)
- Feature lib: kebab-case or descriptive `.ts` (e.g. `lesson-hours.ts`, `tiptap-mapper.ts`)
- Validations: domain noun `.ts` in `shared/lib/validations/` (e.g. `session.ts`, `step-completion.ts`)
- Zustand stores: `*-store.ts` in `features/*/model/` (e.g. `journal-store.ts`)
- Custom hooks: `use-*.ts` in `features/*/model/` (e.g. `use-lesson-page.ts`)

**Directories:**
- Route groups: parentheses — `(auth)`, `(dashboard)`, `(main)`
- Dynamic segments: brackets — `[studentId]`, `[levelId]`, `[stepId]`
- Feature modules: kebab-case — `program-admin`, `user-admin`, `student-portal`, `theme-settings`
- FSD segments within features: `actions/`, `ui/`, `lib/`, `model/`

**Types:**
- Domain roles: `UserRole` type alias in `src/entities/user/model/types.ts`
- Prisma enums re-exported from `src/shared/lib/db.ts` (generated client)
- API payload types defined inline in entity hooks or server action files

**Exports:**
- Barrel files (`index.ts`) used sparingly — `widgets/app-shell/index.ts`, `entities/user/index.ts`, `features/theme-settings/index.ts`
- Most imports use direct file paths with `@/` alias

## Where to Add New Code

**New Page/Route:**
- Authenticated page: `src/app/(dashboard)/<section>/page.tsx`
- Public page: `src/app/(auth)/<name>/page.tsx` or outside route groups
- Pattern: Thin page — call `requireRole()` / server action, pass data to feature UI component

**New Feature:**
- Create `src/features/<feature-name>/` with subfolders:
  - `actions/<feature>-actions.ts` — server actions (`'use server'`)
  - `ui/<ComponentName>.tsx` — React components
  - `lib/` — feature-specific helpers
  - `model/` — hooks, Zustand stores if needed
- Add route in `src/app/(dashboard)/` pointing to feature UI
- Add menu item in `src/widgets/app-shell/ui/AppShell.tsx` `allMenuItems` array
- Add role route rule in `src/shared/lib/auth.config.ts` `roleRoutes` if new section prefix

**New API Endpoint:**
- Create `src/app/api/<resource>/route.ts`
- Use response helpers from `src/shared/api/index.ts`
- Add React Query hook in `src/entities/<entity>/api/use-<resource>.ts`
- Validate input with Zod schema in `src/shared/lib/validations/`

**New Entity:**
- Create `src/entities/<name>/model/types.ts` for shared types
- Create `src/entities/<name>/api/use-<name>.ts` for React Query hooks
- Optional `index.ts` barrel for type exports

**New Database Model:**
- Add model to `prisma/schema.prisma` following conventions (cuid IDs, `createdAt`/`updatedAt`, both relation sides)
- Run `pnpm db:migrate` to create migration
- Access via `prisma.<model>` from `src/shared/lib/prisma.ts`

**New Validation Schema:**
- Add to `src/shared/lib/validations/<domain>.ts`
- Export both Zod schema and inferred TypeScript type

**New Shared UI Component:**
- Place in `src/shared/ui/<ComponentName>.tsx`
- Use for cross-feature primitives (e.g. `Text.tsx`, `Title.tsx`, `RoleGuard.tsx`, `ProgressBar.tsx`)

**New Authorization Rule:**
- Page-level: use `requireRole()` / `requireRoles()` from `src/shared/lib/session.ts`
- API-level: add helper in `src/shared/lib/authorize-*.ts` or `src/shared/lib/group-access.ts`
- Route-level: extend `roleRoutes` in `src/shared/lib/auth.config.ts`

**Utilities:**
- Cross-feature business logic: `src/shared/lib/<name>.ts`
- Feature-specific logic: `src/features/<feature>/lib/<name>.ts`

## Special Directories

**`generated/prisma/`:**
- Purpose: Prisma Client generated output
- Generated: Yes (via `prisma generate` / `postinstall`)
- Committed: Yes

**`public/uploads/`:**
- Purpose: User-uploaded images from program editor
- Generated: Yes (runtime file writes from `src/app/api/uploads/route.ts`)
- Committed: No (gitignored)

**`src/app/(main)/`:**
- Purpose: Reserved route group with `profile/` and `program/` subdirectories
- Generated: No
- Committed: Directories exist but contain no `page.tsx` files — unused

**`.planning/`:**
- Purpose: GSD planning artifacts, quick task summaries
- Generated: By planning tools
- Committed: Yes

**`node_modules/`:**
- Purpose: Package dependencies
- Generated: Yes
- Committed: No

## Route Map

| Path | Page File | Roles |
|------|-----------|-------|
| `/` | `src/app/page.tsx` | Redirect |
| `/login` | `src/app/(auth)/login/page.tsx` | Public |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Redirect hub |
| `/journal` | `src/app/(dashboard)/journal/page.tsx` | TEACHER |
| `/journal/[studentId]` | `src/app/(dashboard)/journal/[studentId]/page.tsx` | TEACHER |
| `/journal/history` | `src/app/(dashboard)/journal/history/page.tsx` | TEACHER |
| `/journal/[studentId]/history` | `src/app/(dashboard)/journal/[studentId]/history/page.tsx` | TEACHER |
| `/groups` | `src/app/(dashboard)/groups/page.tsx` | TEACHER, MANAGER, SUPER_ADMIN |
| `/groups/[groupId]` | `src/app/(dashboard)/groups/[groupId]/page.tsx` | TEACHER, MANAGER, SUPER_ADMIN |
| `/analytics` | `src/app/(dashboard)/analytics/page.tsx` | TEACHER, MANAGER, SUPER_ADMIN |
| `/student/me` | `src/app/(dashboard)/student/me/page.tsx` | STUDENT |
| `/students/[studentId]/edit` | `src/app/(dashboard)/students/[studentId]/edit/page.tsx` | TEACHER, MANAGER, SUPER_ADMIN |
| `/admin/users` | `src/app/(dashboard)/admin/users/page.tsx` | MANAGER, SUPER_ADMIN |
| `/admin/groups` | `src/app/(dashboard)/admin/groups/page.tsx` | MANAGER, SUPER_ADMIN |
| `/admin/program` | `src/app/(dashboard)/admin/program/page.tsx` | MANAGER, SUPER_ADMIN |
| `/admin/program/[levelId]` | `src/app/(dashboard)/admin/program/[levelId]/page.tsx` | MANAGER, SUPER_ADMIN |
| `/admin/program/[levelId]/steps/new` | `src/app/(dashboard)/admin/program/[levelId]/steps/new/page.tsx` | MANAGER, SUPER_ADMIN |
| `/admin/program/[levelId]/steps/[stepId]/edit` | `src/app/(dashboard)/admin/program/[levelId]/steps/[stepId]/edit/page.tsx` | MANAGER, SUPER_ADMIN |
| `/admin/awards` | `src/app/(dashboard)/admin/awards/page.tsx` | MANAGER, SUPER_ADMIN |

## Feature Module Inventory

| Feature | Path | Responsibility |
|---------|------|----------------|
| `auth` | `src/features/auth/` | Login, user switching, remembered accounts |
| `journal` | `src/features/journal/` | Teacher lesson journal, attendance, step grading |
| `groups` | `src/features/groups/` | Group listing and student tables |
| `analytics` | `src/features/analytics/` | Monthly stats, charts (Recharts) |
| `program-admin` | `src/features/program-admin/` | Level/step CRUD, Tiptap content editor |
| `user-admin` | `src/features/user-admin/` | User CRUD, code management |
| `student-admin` | `src/features/student-admin/` | Manual progress editing |
| `student-portal` | `src/features/student-portal/` | Student self-view of sessions |
| `awards` | `src/features/awards/` | Award management |
| `theme-settings` | `src/features/theme-settings/` | Quran reading theme picker |

---

*Structure analysis: 2026-06-24*
