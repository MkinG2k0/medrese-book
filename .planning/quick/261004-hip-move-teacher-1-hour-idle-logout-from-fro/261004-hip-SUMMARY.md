---
quick_id: 261004-hip
slug: move-teacher-1-hour-idle-logout-from-fro
phase: 261004-hip
plan: 01
subsystem: auth
tags: [idle-timeout, hmac, middleware, next-auth, playwright]
status: complete
date: 2026-10-04

requires: []
provides:
  - Edge-safe HMAC teacher_last_active cookie helpers
  - authorized() idle expire rewrite to /api/auth/idle-expire
  - Node idle-expire route that ends lesson, audits logout, clears cookies
  - React Query idle 401 redirect without client idle-timer
affects: [auth, journal, e2e]

actuals:
  tokens: 8687
  tasks: 3
  commits: 4

tech-stack:
  added: []
  removed: [react-idle-timer]
  patterns:
    - Web Crypto HMAC-SHA256 last-active cookie (Edge-safe, no Prisma)
    - NextResponse.rewrite from authorized() to a Node route for DB side effects

key-files:
  created:
    - src/shared/lib/teacher-idle.ts
    - src/shared/lib/teacher-idle.test.ts
    - src/app/api/auth/idle-expire/route.ts
    - e2e/helpers/teacher-idle.ts
  modified:
    - src/shared/lib/auth.config.ts
    - src/shared/api/index.ts
    - src/features/auth/lib/idle-session.ts
    - src/widgets/app-shell/ui/AppShell.tsx
    - src/shared/providers/query-provider.tsx
    - e2e/auth.spec.ts
    - package.json
    - pnpm-lock.yaml
  deleted:
    - src/features/auth/ui/IdleSessionGuard.tsx

key-decisions:
  - "Idle state lives in HMAC cookie teacher_last_active, not JWT (D-04/D-05)"
  - "authorized() returns NextResponse.next() to Set-Cookie on bump; expire rewrites to idle-expire"
  - "Prefetch headers do not bump last-active (D-07 discretion)"
  - "Playwright plants an expired signed cookie instead of clock.fastForward (D-11)"

patterns-established:
  - "Edge-safe activity cookie: sign in shared, enforce in authorized(), mutate DB in Node route"
  - "unauthorizedIdle() 401 JSON { error, reason: 'idle' } for API idle expiry"

requirements-completed:
  - QUICK-261004-hip

coverage:
  - id: D1
    description: HMAC last-active helpers decide bump/allow/expire/skip for teachers only
    requirement: QUICK-261004-hip
    verification:
      - kind: unit
        ref: src/shared/lib/teacher-idle.test.ts
        status: pass
      - kind: unit
        ref: src/features/auth/lib/idle-session.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Client idle-timer removed; idle 401 navigates to /login?reason=idle
    requirement: QUICK-261004-hip
    verification:
      - kind: unit
        ref: src/shared/lib/teacher-idle.test.ts
        status: pass
    human_judgment: true
    rationale: QueryProvider onError/retry and AppShell unmount are not covered by a dedicated unit test
  - id: D3
    description: Teacher with expired signed cookie is sent to /login?reason=idle; manager stays logged in
    requirement: QUICK-261004-hip
    verification:
      - kind: e2e
        ref: e2e/auth.spec.ts#учитель разлогинивается после часа неактивности
        status: unknown
    human_judgment: true
    rationale: Playwright did not run in this worktree (no .env.test/DB/server)

duration: 10min
completed: 2026-10-04
---

# Phase 261004-hip Plan 01: Move teacher idle logout off the client timer Summary

**Teacher 1-hour idle logout is enforced from a signed `teacher_last_active` HMAC cookie in `authorized()`, with a Node expire route that ends the lesson and audits logout; the AppShell client timer is gone.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-04T09:45:38Z
- **Completed:** 2026-10-04T09:55:00Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Idle decision lives in Edge-safe `src/shared/lib/teacher-idle.ts` (Web Crypto HMAC-SHA256, no Prisma, no features imports). Timeout stays 3600000 ms; only TEACHER is subject to idle.
- `authorized()` expires stale/invalid cookies via rewrite to `/api/auth/idle-expire`, bumps last-active on document navigations and mutating methods, and leaves SSE/polls/session GET alone.
- `/api/auth/idle-expire` ends the active teaching session with `LESSON_ENDED` reason `idle`, records `USER_LOGOUT`, signs out, clears the idle cookie, and redirects pages to `/login?reason=idle` or returns 401 `{ reason: 'idle' }` for API `from=` paths.
- `IdleSessionGuard` and `react-idle-timer` are removed. React Query idle errors redirect to `/login?reason=idle` without retry. LoginForm Alert copy is unchanged.
- E2E plants an expired signed cookie instead of `clock.fastForward`.

## Task Commits

1. **Task 1 RED:** `d80988b` (test) add failing tests for teacher idle helpers
2. **Task 1 GREEN:** `8f03d41` (feat) enforce teacher idle via signed last-active cookie
3. **Task 2:** `604b154` (feat) remove client idle timer and redirect idle 401
4. **Task 3:** `73efcca` (test) plant expired HMAC cookie in idle e2e

_Note: TDD for Task 1 used separate RED then GREEN commits. Planning docs were not committed._

## Files Created/Modified

- `src/shared/lib/teacher-idle.ts` — HMAC cookie, shouldBump, decideTeacherIdleAction
- `src/shared/lib/teacher-idle.test.ts` — unit coverage for bump/allow/expire/skip and sign/parse
- `src/shared/lib/auth.config.ts` — idle enforcement after a session exists; jwt callback unchanged
- `src/shared/api/index.ts` — `unauthorizedIdle()`
- `src/app/api/auth/idle-expire/route.ts` — Node GET/POST/PUT/PATCH/DELETE expire handler
- `src/features/auth/lib/idle-session.ts` — re-exports timeout, callback, isTeacherIdleLogoutEnabled
- `src/widgets/app-shell/ui/AppShell.tsx` — no idle-timer child; manual Выйти still uses signOutWithLessonCleanup
- `src/features/auth/ui/IdleSessionGuard.tsx` — deleted
- `src/shared/providers/query-provider.tsx` — QueryCache/MutationCache idle 401 → `/login?reason=idle`, no retry
- `package.json` / `pnpm-lock.yaml` — `react-idle-timer` removed
- `e2e/helpers/teacher-idle.ts` — plant expired HMAC cookie
- `e2e/auth.spec.ts` — teacher idle via expired cookie; manager unchanged; no Playwright clock

## Decisions Made

- Persist last-active in an HMAC cookie, not JWT fields (D-04/D-05).
- Treat `Next-Router-Prefetch=1` and `Purpose=prefetch` as no-bump so sidebar prefetch does not reset idle.
- Convert boolean `true` from `authorized()` to `NextResponse.next()` on teacher allow/bump so Set-Cookie can attach.
- Copy `signOut({ redirect: false })` cookies onto the expire redirect/401, and also clear `teacher_last_active`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Idle-expire still logs out if lesson end or audit throws**
- **Found during:** Task 1 (idle-expire route)
- **Issue:** A failed `LESSON_ENDED` or `USER_LOGOUT` write would skip `signOut` and leave the teacher logged in.
- **Fix:** try/catch around lesson end and audit; always sign out and clear cookies. Matches client logout behavior.
- **Files modified:** `src/app/api/auth/idle-expire/route.ts`
- **Verification:** unit tests pass; route compiles
- **Committed in:** `8f03d41` (Task 1 GREEN)

### Other

**2. Playwright e2e not executed**
- Worktree has no `.env.test` / `.env` / local DB. `pnpm exec playwright test e2e/auth.spec.ts --project=chromium` failed while loading config (`TypeError: context.conditions?.includes is not a function`) before tests ran.
- E2E files were still written. Unit tests (21) passed.
- Recorded in `.planning/WINDOWS.md` as open `unrun-verify`.

**3. `tsc --noEmit` reports a pre-existing AppShell error**
- `src/widgets/app-shell/ui/AppShell.tsx`: `menuItems` `label: Element` vs NavPanel `label: string`. Unrelated to idle-timer removal; not fixed (scope boundary).

**4. Task 2 `tdd=true` without a new test file**
- Plan listed no test file for QueryProvider/AppShell. Verified via existing idle unit tests plus tsc (pre-existing error noted).

---

**Total deviations:** 1 auto-fixed (Rule 2), 3 documented environment/scope notes
**Impact on plan:** Idle enforcement is implemented as specified. E2E still needs a DB-backed Playwright run.

## Issues Encountered

- Playwright cannot start in this worktree without `.env.test` and a test database. Config load also threw a Playwright internals TypeError independent of the new helper.

## User Setup Required

None - no external service configuration required. Local Playwright still needs `.env.test` and a seeded test DB (existing project requirement).

## Next Phase Readiness

- Backend idle path is in place; run `pnpm exec playwright test e2e/auth.spec.ts --project=chromium` on a machine with `.env.test` to confirm cookie-aging E2E.
- No blockers for merging the idle enforcement itself.

## Test Results

- `pnpm exec vitest run src/shared/lib/teacher-idle.test.ts src/features/auth/lib/idle-session.test.ts` — **21 passed**
- `pnpm exec tsc --noEmit -p tsconfig.json` — **failed** on pre-existing AppShell `menuItems` typing (not introduced here)
- `pnpm exec playwright test e2e/auth.spec.ts --project=chromium` — **not run** (no `.env.test`/DB; config load TypeError)

## Known Stubs

None.

## Self-Check: PASSED
