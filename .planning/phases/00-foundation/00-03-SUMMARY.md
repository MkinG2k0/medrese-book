---
phase: 00-foundation
plan: 03
subsystem: api
tags: [next-auth, authorizeApiRequest, default-deny, middleware, playwright, FND-02]

requires:
  - phase: 00-foundation-01
    provides: e2e/api-auth.spec.ts stubs + helpers
provides:
  - authorizeApiRequest default-deny gate with role and resource checks
  - JSON 401 middleware gate for /api/* (except /api/auth)
  - All 5 REST handlers refactored to unified gate
affects: [00-foundation-04, 00-foundation-05, phase-security]

tech-stack:
  added: []
  patterns:
    - "Two-layer API auth: middleware session gate + authorizeApiRequest resource checks"
    - "ApiAuthContext with groupId/studentId/completionId ownership matrix"

key-files:
  created:
    - src/shared/lib/authorize-api-request.ts
  modified:
    - src/shared/lib/auth.config.ts
    - src/app/api/students/route.ts
    - src/app/api/sessions/route.ts
    - src/app/api/step-completions/route.ts
    - src/app/api/step-completions/[id]/route.ts
    - src/app/api/uploads/route.ts
    - e2e/api-auth.spec.ts

key-decisions:
  - "API 401 JSON returned from auth.config authorized callback (matcher already covered /api/*)"
  - "GET /api/sessions checks studentId scope before date branch — closes CONCERNS no-date leak"
  - "step-completions remain TEACHER-only (MANAGER default-deny per Open Question 3)"

patterns-established:
  - "Every REST handler calls authorizeApiRequest before business logic"
  - "STUDENT group/student ownership; TEACHER group/student/completion ownership"

requirements-completed: [FND-02]

duration: 50min
completed: 2026-06-24
---

# Phase 0 Plan 03: API Authorization Summary

**Default-deny `authorizeApiRequest()` with two-layer `/api/*` protection and e2e verification of cross-group/cross-student blocks**

## Performance

- **Duration:** 50 min
- **Started:** 2026-06-24T20:00:00Z
- **Completed:** 2026-06-24T20:50:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Создан `authorizeApiRequest()` с матрицей default-deny: роли, STUDENT self/group, TEACHER group/student/completion
- Middleware-слой: неаутентифицированные запросы к `/api/*` (кроме `/api/auth`) получают JSON 401
- Рефактор 5 REST handlers — единый gate вместо ad hoc `auth()` + manual checks
- Исправлен CONCERNS-баг: GET `/api/sessions` проверяет `studentId` до ветки `if (dateStr)`
- e2e `api-auth.spec.ts` GREEN: 401, cross-group 403, foreign sessions 403, teacher own group 200

## Task Commits

Each task was committed atomically:

1. **Task 1: authorizeApiRequest + middleware session gate** - `e862fc2` (feat)
2. **Task 2: Рефактор 5 API route handlers** - `29f4944` (feat)
3. **Task 3: GREEN e2e api-auth.spec.ts** - `c8c137a` (test)

## Files Created/Modified

- `src/shared/lib/authorize-api-request.ts` — default-deny API gate
- `src/shared/lib/auth.config.ts` — JSON 401 for unauthenticated `/api/*`
- `src/app/api/students/route.ts` — allowedRoles + groupId context
- `src/app/api/sessions/route.ts` — studentId scope before date branch; POST TEACHER-only
- `src/app/api/step-completions/route.ts` — TEACHER + studentId via authorizeApiRequest
- `src/app/api/step-completions/[id]/route.ts` — TEACHER + completionId
- `src/app/api/uploads/route.ts` — MANAGER/SUPER_ADMIN only
- `e2e/api-auth.spec.ts` — negative + positive teacher case

## Decisions Made

- API 401 реализован в `auth.config.ts` `authorized` callback — matcher уже включал `/api/*` кроме `/api/auth`
- `Session` type из `next-auth` для return type (избежание конфликта с Prisma Session)
- step-completions остаются TEACHER-only; MANAGER не получает доступ (default-deny)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test DB schema drift blocked e2e seed**
- **Found during:** Task 3 (e2e verification)
- **Issue:** `.env.test` Neon DB missing columns (`phone`, `fullName`); migrate history drift
- **Fix:** `migrate resolve --applied` for drifted migrations, `prisma db push`, then `db:seed`
- **Files modified:** none (DB operational fix)
- **Verification:** seed completed; e2e GREEN with CI=1 fresh webServer
- **Committed in:** N/A (operational DB fix)

**2. [Rule 1 - Bug] TypeScript Session type conflict in authorizeApiRequest**
- **Found during:** Task 1 (tsc verify)
- **Issue:** `NonNullable<Awaited<ReturnType<typeof auth>>>` resolved incorrectly vs Prisma Session
- **Fix:** Use `Session` from `next-auth` for AuthorizeSuccess type
- **Files modified:** src/shared/lib/authorize-api-request.ts
- **Verification:** tsc — no errors in authorize-api-request.ts
- **Committed in:** e862fc2

---

**Total deviations:** 2 auto-fixed (1 blocking operational, 1 type bug)
**Impact on plan:** Required for e2e verification and clean compile; no scope creep

## Issues Encountered

- e2e with `reuseExistingServer` + dev on :3000 can mismatch DATABASE_URL between server and db helpers — use CI=1 or ensure same test DB
- `pnpm run build` fails on pre-existing `UsersTable.tsx:87` type error (unrelated to this plan)

## User Setup Required

None — test DB synced via db push + seed during execution.

## Next Phase Readiness

- FND-02 complete; all API routes use unified gate
- Plan 04 can implement student-progress module without API auth changes
- New API routes must call `authorizeApiRequest` + inherit middleware session gate

## Self-Check: PASSED

- FOUND: src/shared/lib/authorize-api-request.ts
- FOUND: e862fc2, 29f4944, c8c137a

---
*Phase: 00-foundation*
*Completed: 2026-06-24*
