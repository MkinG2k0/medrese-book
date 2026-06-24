# Codebase Concerns

**Analysis Date:** 2026-06-24

## Tech Debt

**API authorization inconsistency:**
- Issue: Route handlers apply auth checks ad hoc; some endpoints allow broader access than page-level middleware implies. `middleware.ts` excludes all `/api/*` except `/api/auth` from the auth matcher, so every API route must enforce its own policy.
- Files: `middleware.ts`, `src/app/api/students/route.ts`, `src/app/api/sessions/route.ts`, `src/shared/lib/authorize-student.ts`, `src/shared/lib/authorize-student-access.ts`
- Impact: Authorization bugs are easy to introduce when adding new endpoints; behavior differs between UI routes and API routes.
- Fix approach: Extract shared `authorizeApiAccess(resource, action)` helpers; add a middleware matcher or route-group wrapper for `/api/*`; audit all handlers against a role matrix.

**Global step index logic spread across modules:**
- Issue: `currentStepIdx` is a global offset across all levels, computed via `getStepOffsetForLevel()` (COUNT query) plus local indices. Logic is duplicated in journal, student-admin, user-admin, recalculate, and student portal.
- Files: `src/shared/lib/step-offset.ts`, `src/shared/lib/recalculate-step-progress.ts`, `src/shared/lib/sync-completions-for-progress.ts`, `src/features/journal/actions/journal-actions.ts`, `src/features/student-admin/actions/student-admin-actions.ts`, `src/features/user-admin/actions/user-actions.ts`, `src/features/journal/model/use-lesson-page.ts`
- Impact: Subtle off-by-one or level-transition bugs when changing program structure; hard to reason about progress state.
- Fix approach: Centralize progress calculation in one service module; cache level offsets; add integration tests for level transitions.

**Synthetic sessions for progress adjustments:**
- Issue: `syncCompletionsForProgress()` auto-creates a `PRESENT` session with note «Корректировка прогресса» when admin changes student progress, and backfills `StepCompletion` records.
- Files: `src/shared/lib/sync-completions-for-progress.ts`, `src/features/student-admin/actions/student-admin-actions.ts`, `src/features/user-admin/actions/user-actions.ts`
- Impact: Attendance/analytics metrics include artificial sessions; journal history shows non-real lessons.
- Fix approach: Separate «progress adjustment» audit table or flag sessions as `isAdjustment`; exclude from analytics queries.

**Session save replaces all completions:**
- Issue: `POST /api/sessions` on existing session runs `completions: { deleteMany: {}, create: [...] }`, wiping prior completion IDs and notes atomically.
- Files: `src/app/api/sessions/route.ts`
- Impact: Concurrent edits or partial saves can lose completion history; no soft-delete or merge strategy.
- Fix approach: Upsert completions by `stepId`; use transaction wrapping session + `recalculateStudentStepIdx`.

**Unused dependency:**
- Issue: `@aws-sdk/client-s3` is listed in `package.json` but no imports exist in `src/` or `prisma/`.
- Files: `package.json`
- Impact: Larger install surface; misleading expectation of S3-backed uploads (actual storage is local `public/uploads/`).
- Fix approach: Remove dependency or implement S3 upload path in `src/app/api/uploads/route.ts`.

**Beta auth library:**
- Issue: `next-auth@5.0.0-beta.30` in production dependencies.
- Files: `package.json`, `src/shared/lib/auth.ts`, `src/shared/lib/auth.config.ts`
- Impact: Breaking API changes, incomplete docs, potential security patches delayed vs stable release.
- Fix approach: Track stable v5 release; pin and test upgrades; document auth config migration path.

**Missing `.env.example`:**
- Issue: `README.md` instructs `cp .env.example .env`, but only `.env.test.example` exists in the repo.
- Files: `README.md`, `.env.test.example`
- Impact: Onboarding friction; developers may misconfigure `DATABASE_URL` / `AUTH_SECRET`.
- Fix approach: Add `.env.example` with documented keys (no secrets).

**Package name mismatch:**
- Issue: `package.json` name is `quran-teacher`; repository folder is `medrese-book`.
- Files: `package.json`
- Impact: Confusion in deployment scripts, Docker images, and monorepo references.
- Fix approach: Align `name` with product/repo naming.

**Prisma schema conventions gaps:**
- Issue: Models lack `updatedAt` on most entities; no `@@index` on frequently queried FKs (`studentId`, `sessionId`, `groupId`, `teacherId`); `StepCompletion` has no unique constraint on `(studentId, stepId)`.
- Files: `prisma/schema.prisma`
- Impact: Duplicate completion rows possible; slower queries as data grows; harder optimistic concurrency.
- Fix approach: Add indexes per query patterns; add `@@unique([studentId, stepId])` or document intentional duplicates; add `updatedAt` where entities are edited.

**Program step reordering uses temporary high order:**
- Issue: `moveStepOrder()` sets `order: (_max.order ?? 0) + 1000` as intermediate value during reorder.
- Files: `src/features/program-admin/actions/program-actions.ts`
- Impact: Order gaps grow over time; eventual integer overflow risk (remote); fragile if concurrent edits.
- Fix approach: Renumber in single transaction with deterministic temp negative orders; periodic compaction script exists pattern in `prisma/renumber-level-steps.ts`.

## Known Bugs

**STUDENT role can read arbitrary group rosters via API:**
- Symptoms: Any authenticated user, including `STUDENT`, can call `GET /api/students?groupId=...` and receive student names, progress, attendance for that group. Only `TEACHER` ownership is checked.
- Files: `src/app/api/students/route.ts`
- Trigger: Authenticated student sends request with another group's `groupId`.
- Workaround: None in code; UI does not expose this to students.

**STUDENT role can read arbitrary session history via API:**
- Symptoms: `GET /api/sessions?studentId=...` without `date` param returns last 30 sessions with completions for any student. Teacher ownership check only runs when `date` is provided.
- Files: `src/app/api/sessions/route.ts`
- Trigger: Authenticated student (or any role) calls endpoint without `date`.
- Workaround: None in code.

**Duplicate step completions silently collapsed in app logic:**
- Symptoms: `getCompletionsByStepId()` keeps last completion per `stepId`; DB may hold multiple rows per step. Progress recalculation and UI may disagree with raw DB state.
- Files: `src/shared/lib/step-completion.ts`, `prisma/schema.prisma`
- Trigger: Multiple completions created for same student+step (e.g. progress sync + lesson save).
- Workaround: Manual DB cleanup.

## Security Considerations

**6-digit credential brute force:**
- Risk: Login uses 6-digit numeric codes (`src/shared/lib/auth.ts`, `src/features/auth/actions/login-actions.ts`). ~1M combinations; no rate limiting, lockout, or CAPTCHA.
- Files: `src/shared/lib/auth.ts`, `src/features/auth/actions/login-actions.ts`, `src/shared/lib/generate-unique-code.ts`
- Current mitigation: Generic error message «Неверный код доступа»; codes are random for new users.
- Recommendations: Rate-limit `/login` and credentials provider; increase code entropy; add attempt logging; consider expiring codes.

**Login codes stored in browser localStorage:**
- Risk: `RememberedAccountsSelect` persists full 6-digit codes in `localStorage` under key `medrese-remembered-accounts`.
- Files: `src/features/auth/lib/remembered-accounts-storage.ts`, `src/features/auth/ui/LoginForm.tsx`
- Current mitigation: `SUPER_ADMIN` and `MANAGER` codes are excluded from remember list.
- Recommendations: Store only user id + name; re-prompt for code; or use secure httpOnly session switching without exposing codes.

**User impersonation (switch user):**
- Risk: `switchUser()` signs in as any user by fetching their `code` from DB. Allowed for `SUPER_ADMIN`/`MANAGER` in production; in development, `canSwitchUser()` returns true for all roles.
- Files: `src/features/auth/actions/switch-user-actions.ts`, `src/features/auth/lib/can-switch-user.ts`
- Current mitigation: Role check on server action.
- Recommendations: Restrict impersonation to non-production; audit log impersonation events; never expose target user's code to client.

**Predictable seed credentials documented publicly:**
- Risk: `README.md` lists fixed test codes (`100001`, `300001`, etc.) printed by `prisma/seed.ts`.
- Files: `README.md`, `prisma/seed.ts`
- Current mitigation: Intended for dev only.
- Recommendations: Ensure production seed is never run; use random codes in seed for shared environments; remove codes from committed docs or gate behind dev-only doc.

**Unvalidated file uploads to public directory:**
- Risk: `POST /api/uploads` accepts any file, writes to `public/uploads/`, returns public URL. No size limit, MIME whitelist, or filename collision handling beyond timestamp prefix.
- Files: `src/app/api/uploads/route.ts`, `middleware.ts` (uploads path excluded from auth matcher)
- Current mitigation: Requires `SUPER_ADMIN` or `MANAGER` session.
- Recommendations: Validate MIME/size; store outside `public/` with signed URLs; scan uploads; use S3 or similar (dependency already present but unused).

**Stored HTML rendered without sanitization:**
- Risk: `BlockRenderer` uses `dangerouslySetInnerHTML` for text blocks from `Step.content` JSON. Malicious HTML/script in step content executes in browsers.
- Files: `src/features/program-admin/ui/BlockRenderer.tsx`, `src/shared/lib/validations/step.ts`
- Current mitigation: Only admins can edit steps via `program-actions.ts`.
- Recommendations: Sanitize HTML on save (DOMPurify server-side); CSP headers; restrict allowed tags in Tiptap output.

**API routes bypass middleware auth:**
- Risk: `middleware.ts` matcher excludes `/api/*` (except `/api/auth`). Misconfigured handler = open endpoint.
- Files: `middleware.ts`, all files under `src/app/api/`
- Current mitigation: Per-route `auth()` checks in existing handlers.
- Recommendations: Default-deny middleware for `/api/*`; integration tests per route.

## Performance Bottlenecks

**Repeated `getStepOffsetForLevel` COUNT queries:**
- Problem: Each call runs `prisma.step.count({ where: { level: { number: { lt: levelNumber } } } })`.
- Files: `src/shared/lib/step-offset.ts` (called from 8+ files)
- Cause: No caching; invoked on every lesson load, progress edit, recalculation.
- Improvement path: Precompute offsets map at startup or cache per request; use `getLevelStepOffsets()` batch helper already present.

**Analytics loads full student graphs:**
- Problem: `getTopStudents()` and `getLevelStats()` fetch all students (or all in teacher scope) with nested completions and sessions for the month.
- Files: `src/shared/lib/analytics.ts`, `src/features/analytics/actions/analytics-actions.ts`
- Cause: No pagination, aggregation in SQL, or materialized views.
- Improvement path: SQL `GROUP BY` aggregates; limit top-N in query; index `createdAt` / `date` columns.

**Journal lesson page triggers server recalculate on every load:**
- Problem: `getStudentLesson()` calls `recalculateStudentStepIdx(studentId)` before fetching data.
- Files: `src/features/journal/actions/journal-actions.ts`, `src/shared/lib/recalculate-step-progress.ts`
- Cause: Defensive sync on read path.
- Improvement path: Recalculate only on write (session save, completion update); lazy background job.

**User batch creation N+1:**
- Problem: `createUsers()` loops entries, calling `generateUniqueCode()` (DB lookup each iteration) and separate transactions per student.
- Files: `src/features/user-admin/actions/user-actions.ts`, `src/shared/lib/generate-unique-code.ts`
- Cause: Sequential loop without batching.
- Improvement path: Pre-generate code pool; single transaction for batch.

## Fragile Areas

**`use-lesson-page` client hook (365 lines):**
- Files: `src/features/journal/model/use-lesson-page.ts`, `src/features/journal/model/journal-store.ts`
- Why fragile: Combines attendance, step visibility, grading state, session persistence, and navigation; mixes React Query, Zustand, and local state.
- Safe modification: Extract sub-hooks (`useLessonAttendance`, `useLessonSteps`); add e2e coverage before refactors.
- Test coverage: Partial — `e2e/journal.spec.ts` covers happy path only.

**Tiptap ↔ step content mapping:**
- Files: `src/features/program-admin/lib/tiptap-mapper.ts`, `src/features/program-admin/ui/editor/StepEditor.tsx`
- Why fragile: Custom `arabicBlock` extension; HTML parsing via `DOMParser`; regex-based heading detection; lossy round-trip for complex formatting.
- Safe modification: Add snapshot tests for `tiptapToStepContent` / `stepContentToTiptap`; validate in `program-actions.ts` before save.
- Test coverage: None.

**Level step order shifting:**
- Files: `src/features/program-admin/actions/program-actions.ts`, `prisma/renumber-level-steps.ts`
- Why fragile: Multi-step order updates in transactions; manual renumber script exists as separate maintenance tool.
- Safe modification: Always run reorder through `reserveStepOrderSlot` / `moveStepOrder`; run `pnpm db:renumber-steps` after bulk imports.
- Test coverage: None.

**Progress recalculation + level auto-advance:**
- Files: `src/shared/lib/recalculate-step-progress.ts`
- Why fragile: Auto-moves student to next `levelId` when all steps passed; interacts with global `currentStepIdx` and completion map overwrites.
- Safe modification: Test level-boundary scenarios; wrap updates in transaction with completion fetch.
- Test coverage: Indirect via e2e journal flow only.

## Scaling Limits

**Local filesystem uploads:**
- Current capacity: All images in `public/uploads/` on app server disk.
- Limit: Disk space, no CDN, lost on ephemeral deploys (Vercel/serverless incompatible).
- Scaling path: Move to object storage (S3); update `next.config.ts` `images.remotePatterns`.

**Single PostgreSQL instance:**
- Current capacity: Standard Prisma + `@prisma/adapter-pg` connection per server instance (`src/shared/lib/create-prisma-client.ts`).
- Limit: Connection pool exhaustion under concurrent teachers saving lessons; no read replicas.
- Scaling path: PgBouncer; connection limit config; read replica for analytics queries.

**JWT sessions without server-side revocation:**
- Current capacity: Stateless JWT via NextAuth (`auth.config.ts` `strategy: 'jwt'`).
- Limit: Cannot invalidate sessions on code reset without secret rotation; stolen JWT valid until expiry.
- Scaling path: Database sessions; short JWT expiry; refresh on code change in `user-actions.ts`.

## Dependencies at Risk

**`next-auth@5.0.0-beta.30`:**
- Risk: Pre-release API; `trustHost: true` in `auth.config.ts` required for deployment flexibility.
- Impact: Auth breakage on upgrade; subtle session/cookie behavior changes.
- Migration plan: Monitor stable v5 release notes; test `authorized` callback and credentials provider after each bump.

**`typescript@6.0.3`:**
- Risk: Very new major; ecosystem typings (Ant Design, Next.js) may lag.
- Impact: Build failures or incorrect type narrowing in CI.
- Migration plan: Pin to 5.x if issues arise; verify `pnpm build` after upgrades.

## Missing Critical Features

**No CI pipeline:**
- Problem: No `.github/workflows` or other CI config detected.
- Blocks: Automated lint, build, migration check, e2e on PRs.

**No production error monitoring:**
- Problem: Errors logged via `console.error` in dev only (`src/shared/api/index.ts`); no Sentry/Datadog.
- Blocks: Proactive incident detection in production.

**No audit trail for admin mutations:**
- Problem: User creation, code reset, progress adjustment, program edits have no immutable audit log.
- Blocks: Accountability and forensic review after data incidents.

## Test Coverage Gaps

**API route authorization:**
- What's not tested: `GET /api/students`, `GET /api/sessions` (without date), `POST /api/uploads` abuse cases, cross-teacher access.
- Files: `src/app/api/students/route.ts`, `src/app/api/sessions/route.ts`, `src/app/api/uploads/route.ts`
- Risk: Authorization regressions ship unnoticed.
- Priority: High

**Program admin editor:**
- What's not tested: Step create/edit/reorder, Tiptap content round-trip, image upload in editor.
- Files: `src/features/program-admin/`, `src/app/(dashboard)/admin/program/`
- Risk: Content corruption or editor crashes in production.
- Priority: Medium

**Student progress manual adjustment:**
- What's not tested: `updateStudentProgress`, synthetic session creation, completion backfill.
- Files: `src/features/student-admin/actions/student-admin-actions.ts`, `src/shared/lib/sync-completions-for-progress.ts`
- Risk: Wrong progress state after admin edit.
- Priority: High

**Awards module:**
- What's not tested: CRUD flows in `src/features/awards/`.
- Risk: Manager workflow breaks silently.
- Priority: Low

**Unit tests absent entirely:**
- What's not tested: All `src/shared/lib/*` pure functions (`step-completion.ts`, `calendar-date.ts`, `tiptap-mapper.ts`).
- Files: No `*.test.ts` under `src/`; only `e2e/*.spec.ts` (5 files, ~30 tests).
- Risk: Refactoring shared logic without safety net.
- Priority: Medium

---

*Concerns audit: 2026-06-24*
