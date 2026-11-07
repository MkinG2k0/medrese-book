---
phase: 16-cashier-role-access
plan: 03
subsystem: testing
tags: [cashier, e2e, playwright, vitest, seed, user-admin, rbac]

requires:
  - phase: 16-01
    provides: Role.CASHIER + ROLE_ROUTES dual allow + AppShell menu
  - phase: 16-02
    provides: assertCashierCashMethod + UI CASH lock
provides:
  - Seed cashier 400002 + TEST_CODES.cashier
  - User-admin assignable CASHIER (create/filter/detail labels)
  - Pending payment-request badge for CASHIER
  - Full match-role-route CASHIER/ACCOUNTANT unit matrix
  - e2e/cashier-role.spec.ts cashier vs accountant
affects:
  - phase-verify / ship gates for CASH-01/02/03 TEST-01/04

actuals:
  tokens: 2590
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "requireRole(s) wrong-role → getDefaultRedirect (deny→home), not /login"
    - "E2E cashier uses loginAs + TEST_CODES.cashier; accountant method via ant-select-item title"

key-files:
  created:
    - e2e/cashier-role.spec.ts
    - .planning/phases/16-cashier-role-access/16-03-SUMMARY.md
  modified:
    - src/features/user-admin/ui/CreateUserForm.tsx
    - src/features/user-admin/ui/UsersTable.tsx
    - src/features/user-admin/ui/UserDetailModal.tsx
    - src/app/(dashboard)/layout.tsx
    - prisma/seed.ts
    - prisma/seed-e2e.ts
    - e2e/helpers/codes.ts
    - src/shared/lib/match-role-route.test.ts
    - src/shared/lib/session.ts

key-decisions:
  - "Seed cashier code 400002 / name «Кассир Тест» next to accountant 400001"
  - "TDD task 2: matrix-only — routing behavior already from 16-01; single test commit"
  - "Wrong-role RSC gate redirects to role home so cashier deep-link deny lands on payments"

patterns-established:
  - "Cashier E2E: login → payments home, narrow menuitem allow/deny, CASH-only Select, accountant CARD/TRANSFER smoke"

requirements-completed: [CASH-01, TEST-01, TEST-04, CASH-02, CASH-03]

coverage:
  - id: D1
    description: Managers can assign CASHIER; seed/TEST_CODES 400002; cashier pending badge
    requirement: CASH-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false
  - id: D2
    description: Full CASHIER allow/deny + ACCOUNTANT regression in match-role-route unit matrix
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "pnpm test:unit src/shared/lib/match-role-route.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: E2E cashier narrow access + accountant payments method non-regression
    requirement: TEST-04
    verification:
      - kind: e2e
        ref: "pnpm test:e2e e2e/cashier-role.spec.ts --project=chromium"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-11-05
status: complete
---

# Phase 16 Plan 03: Seed, user-admin CASHIER & role E2E Summary

Assignable CASHIER + seed `400002`, full longest-prefix unit matrix, and green Playwright cashier-vs-accountant suite (TEST-01/04).

## Performance

- **Duration:** ~18 min
- **Started:** 2026-11-05T13:30:05Z
- **Completed:** 2026-11-05T13:46:40Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- User-admin create/filter/detail show «Кассир»; seed + `TEST_CODES.cashier = 400002`
- Pending payment-request badge counts for ACCOUNTANT **and** CASHIER
- Unit matrix covers CASHIER payments/payment-requests allow and nested accounting deny; ACCOUNTANT regression
- `e2e/cashier-role.spec.ts` green: login/menu/CASH-only/deny deep-links + accountant CARD/TRANSFER

## Task Commits

1. **Task 1: User-admin CASHIER + seed 400002 + pending badge** - `da35525` (feat)
2. **Task 2: Extend match-role-route unit matrix for CASHIER** - `bee80f3` (test)
3. **Task 3: Playwright e2e/cashier-role.spec.ts** - `2a3c739` (feat)

**Plan metadata:** `47b35e5` (docs: complete plan)

## Files Created/Modified

- `e2e/cashier-role.spec.ts` — cashier vs accountant role matrix
- `e2e/helpers/codes.ts` — `TEST_CODES.cashier`
- `prisma/seed.ts` / `prisma/seed-e2e.ts` — user 400002 CASHIER
- `src/features/user-admin/ui/*` — CASHIER labels/options
- `src/app/(dashboard)/layout.tsx` — pending badge for CASHIER
- `src/shared/lib/match-role-route.test.ts` — full CASHIER/ACCOUNTANT cases
- `src/shared/lib/session.ts` — wrong-role → `getDefaultRedirect`

## Decisions Made

- TDD RED skipped for task 2: route behavior already shipped in 16-01; task only expands regression tests (one `test(...)` commit).
- RSC `requireRole`/`requireRoles` send wrong-role users to role home (aligns with deny→home), enabling stable deep-link E2E.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong-role RSC redirected to /login**
- **Found during:** Task 3 (cashier deep-link E2E)
- **Issue:** Cashier `goto /accounting` or `/accounting/salaries` landed on `/login` via `requireRole('ACCOUNTANT')` instead of payments home
- **Fix:** `requireRole` / `requireRoles` redirect to `getDefaultRedirect(role)`
- **Files modified:** `src/shared/lib/session.ts`
- **Commit:** `2a3c739`

**2. [Rule 3 - Blocking] E2E env bootstrap**
- **Found during:** Task 3 verify
- **Issue:** Node 22.15 + Playwright 1.61 `context.conditions?.includes` crash; test DB missing tables; sandbox `PLAYWRIGHT_BROWSERS_PATH` without browsers
- **Fix:** Ran under Node 22.22; `pnpm db:migrate:deploy` + seed against `.env.test`; `playwright install chromium` with unset sandbox browsers path
- **Files modified:** none (env/tooling only)

## Test Results

| Check | Result |
|-------|--------|
| `pnpm exec tsc --noEmit -p tsconfig.json` | pass |
| `pnpm test:unit src/shared/lib/match-role-route.test.ts` | 32 passed |
| `pnpm test:unit src/features/accounting/lib/assert-cashier-cash-method.test.ts` | 7 passed |
| `pnpm test:e2e e2e/cashier-role.spec.ts --project=chromium` | 11 passed (7 setup + 4 cashier) |

## TDD Gate Compliance

Task 2 was `tdd="true"` but implementation already existed from 16-01. Only GREEN-side regression tests committed (`test(16-03): …`). No separate RED failing-test commit — documented intentionally.

## Known Stubs

None.

## Threat Flags

None beyond plan threat model (manager assign CASHIER; seed codes test-only).

## Self-Check: PASSED

- FOUND: e2e/cashier-role.spec.ts
- FOUND: e2e/helpers/codes.ts (cashier)
- FOUND: prisma/seed.ts + seed-e2e.ts (400002)
- FOUND commits: da35525, bee80f3, 2a3c739
