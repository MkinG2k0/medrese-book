---
phase: 260722-wka-teacher-salary-nav-bug
plan: 01
subsystem: auth
tags: [middleware, role-routes, nextauth, appshell, vitest]

requires: []
provides:
  - matchRoleRouteAccess longest-prefix helper with early-allow
  - regression tests for nested roleRoutes with different roles
  - AppShell selectedKey without false Journal highlight
affects: [middleware, navigation]

tech-stack:
  added: []
  patterns:
    - "Pure ROLE_ROUTES matcher returns allow|deny|login|none; authorized maps decisions to redirects"
    - "Longest-prefix match stops on first hit (no parent fall-through)"

key-files:
  created:
    - src/shared/lib/match-role-route.ts
    - src/shared/lib/match-role-route.test.ts
  modified:
    - src/shared/lib/auth.config.ts
    - src/widgets/app-shell/ui/AppShell.tsx

key-decisions:
  - "Extract ROLE_ROUTES + matchRoleRouteAccess to shared pure helper so authorized cannot resume loop after allow"
  - "AppShell selectedKey returns undefined (empty selectedKeys) when pathname is outside role menu"

patterns-established:
  - "Nested roleRoutes with different role lists must be covered by unit tests (parent vs child)"

requirements-completed:
  - QUICK-teacher-salary-nav-bug

coverage:
  - id: D1
    description: "TEACHER opens /accounting/my-salary without fall-through deny to ACCOUNTANT /accounting"
    requirement: QUICK-teacher-salary-nav-bug
    verification:
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#TEACHER на /accounting/my-salary → allow"
        status: pass
    human_judgment: false
  - id: D2
    description: "ACCOUNTANT allowed on /accounting and denied on /accounting/my-salary"
    requirement: QUICK-teacher-salary-nav-bug
    verification:
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#ACCOUNTANT accounting cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "Nested analytics/student role splits locked by regression tests"
    requirement: QUICK-teacher-salary-nav-bug
    verification:
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#analytics nested prefixes"
        status: pass
    human_judgment: false
  - id: D4
    description: "AppShell does not highlight Journal when pathname matches no menu item"
    requirement: QUICK-teacher-salary-nav-bug
    verification: []
    human_judgment: true
    rationale: "UI highlight behavior needs visual smoke as teacher on /accounting/my-salary"

duration: 3min
completed: 2026-07-22
status: complete
---

# Phase 260722-wka Plan 01: Teacher Salary Nav Bug Summary

**Longest-prefix role route matching now stops after allow, so TEACHER `/accounting/my-salary` is no longer redirected to `/journal` via ACCOUNTANT `/accounting`; AppShell no longer falsely highlights Journal.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-22T20:31:08Z
- **Completed:** 2026-07-22T20:33:00Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Extracted `ROLE_ROUTES` + `matchRoleRouteAccess` with immediate return on first prefix match
- Wired `auth.config` `authorized` to helper decisions (`login` / `deny` / allow|none)
- Added 13 vitest cases covering accounting, analytics, and student nesting
- Removed AppShell `selectedKey` fallback to `menuItems[0]` (Journal)

## Task Commits

1. **Task 1: Extract matchRoleRouteAccess and fix authorized early-allow** - `d8b8003` (feat)
2. **Task 2: Regression unit tests for nested roleRoutes** - `e2ab0f3` (test)
3. **Task 3: Harden AppShell selectedKey — no false Journal highlight** - `da2b381` (fix)

**Plan metadata:** skipped (orchestrator handles docs commit)

## Files Created/Modified

- `src/shared/lib/match-role-route.ts` — pure longest-prefix matcher + ROLE_ROUTES map
- `src/shared/lib/match-role-route.test.ts` — regression suite (13 cases)
- `src/shared/lib/auth.config.ts` — authorized uses matcher; early-allow via helper
- `src/widgets/app-shell/ui/AppShell.tsx` — selectedKey undefined when no menu match

## Decisions Made

- Kept ROLE_ROUTES contents identical to former inline `roleRoutes` (no role/prefix changes)
- Denied redirects still use `getDefaultRedirect`; unmatched paths still `return true`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Redeploy production so middleware fix ships (out of scope for this quick task)
- Manual smoke: teacher → «Моя зарплата» stays on `/accounting/my-salary` with correct sidebar highlight

## Self-Check: PASSED

- FOUND: `src/shared/lib/match-role-route.ts`
- FOUND: `src/shared/lib/match-role-route.test.ts`
- FOUND: `src/shared/lib/auth.config.ts` uses `matchRoleRouteAccess`
- FOUND: commits `d8b8003`, `e2ab0f3`, `da2b381`
- FOUND: `pnpm exec vitest run src/shared/lib/match-role-route.test.ts` — 13 passed

---
*Phase: 260722-wka-teacher-salary-nav-bug*
*Completed: 2026-07-22*
