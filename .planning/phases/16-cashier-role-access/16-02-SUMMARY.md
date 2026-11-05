---
phase: 16-cashier-role-access
plan: 02
subsystem: accounting
tags: [rbac, cashier, payments, vitest, nextauth, antd]

requires:
  - phase: 16-01
    provides: Role.CASHIER + dual ROLE_ROUTES + RSC cash-desk gates
provides:
  - assertCashierCashMethod server guard (CASH-only for CASHIER)
  - canReverseForActor cashier clamp (D-06)
  - Dual-role payment create/batch/history APIs
  - Dual-role payment-request confirm/reject + CASH confirm
  - Cashier UI method lock + hidden Excel export
affects:
  - 16-03 (seed cashier, user-admin, E2E role matrix)

actuals:
  tokens: 3869
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Shared assertCashierCashMethod after Zod parse on cash write paths"
    - "History canReverse clamped per actor role; reverse route stays ACCOUNTANT-only"

key-files:
  created:
    - src/features/accounting/lib/assert-cashier-cash-method.ts
    - src/features/accounting/lib/assert-cashier-cash-method.test.ts
  modified:
    - src/app/api/accounting/payments/route.ts
    - src/app/api/accounting/payments/batch/route.ts
    - src/app/api/accounting/payments/history/route.ts
    - src/features/accounting/actions/payment-request-actions.ts
    - src/features/accounting/ui/StudentPaymentsPage.tsx
    - src/features/accounting/ui/PaymentRequestsPage.tsx

key-decisions:
  - "Cash-only message: «Кассир может проводить только наличные» (from RESEARCH Pattern 2)"
  - "UI: disabled Select with only CASH option for cashier (Ant Select, D-05 discretion)"
  - "PaymentHistoryDrawer unchanged — reverse hide via history API canReverseForActor"

patterns-established:
  - "CASH_DESK_ROLES = ACCOUNTANT+CASHIER for cash write/read; never widen reverse/export"
  - "Method guard after schema parse, before mutation"

requirements-completed: [CASH-01, CASH-02, CASH-03]

coverage:
  - id: D1
    description: assertCashierCashMethod + canReverseForActor Vitest green
    requirement: CASH-02
    verification:
      - kind: unit
        ref: "pnpm test:unit src/features/accounting/lib/assert-cashier-cash-method.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Dual-role payment APIs + CASH-only create/batch for cashier; reverse untouched
    requirement: CASH-02
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false
  - id: D3
    description: Payment-request confirm CASH guard + reject dual-role for cashier
    requirement: CASH-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false
  - id: D4
    description: Cashier UI locked to CASH; Excel hidden; accountant keeps full methods
    requirement: CASH-03
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-05
status: complete
---

# Phase 16 Plan 02: Cashier cash guards Summary

**Server + UI cash-only contour for CASHIER: shared method/reverse guards, dual-role payment APIs and request actions, locked CASH Select and hidden Excel — ACCOUNTANT paths unchanged, reverse route still ACCOUNTANT-only.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-05T13:24:26Z
- **Completed:** 2026-11-05T13:28:00Z
- **Tasks:** 3 (TDD RED/GREEN + actions + UI)
- **Files modified:** 8

## Accomplishments

- Extracted `assertCashierCashMethod` / `canReverseForActor` with Vitest (7 tests)
- Wired dual-role create/list/batch/history; cashier non-CASH → 403; history `canReverse` forced false for cashier
- Confirm/reject payment requests allow CASHIER; confirm enforces CASH; UI locks method and hides Excel

## Task Commits

1. **Task 1 RED: Server cash guards tests** - `6f9e086` (test)
2. **Task 1 GREEN: Guards + payment APIs** - `5e3fb71` (feat)
3. **Task 2: Payment-request confirm/reject dual-role + CASH** - `a7150d3` (feat)
4. **Task 3: UI method lock / hide export** - `b5a6b33` (feat)

**Plan metadata:** `bf14d5e` (docs: complete plan)

## Files Created/Modified

- `src/features/accounting/lib/assert-cashier-cash-method.ts` — method + reverse actor guards
- `src/features/accounting/lib/assert-cashier-cash-method.test.ts` — Vitest behavior cases
- `src/app/api/accounting/payments/route.ts` — dual-role GET/POST + CASH check
- `src/app/api/accounting/payments/batch/route.ts` — dual-role POST + CASH check
- `src/app/api/accounting/payments/history/route.ts` — dual-role GET + canReverse clamp
- `src/features/accounting/actions/payment-request-actions.ts` — requireRoles + confirm guard
- `src/features/accounting/ui/StudentPaymentsPage.tsx` — CASH lock + hide Excel
- `src/features/accounting/ui/PaymentRequestsPage.tsx` — CASH lock for cashier

## Decisions Made

- Error copy from RESEARCH: «Кассир может проводить только наличные»
- Disabled Select with single CASH option (not Radio) per D-05 / CONTEXT discretion
- Left `PaymentHistoryDrawer` unchanged; D-06 UI hide via API `canReverse=false`
- No lib barrel added (feature has no `lib/index.ts`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PowerShell host: bash `gsd_run` shim rewritten as PowerShell function

## User Setup Required

None.

## Next Phase Readiness

- Ready for **16-03** (seed `400002`, user-admin CASHIER, full route matrix + E2E)
- Reverse/export/dashboard/expenses/salaries APIs intentionally still ACCOUNTANT-only

## Verify Results

- `pnpm test:unit src/features/accounting/lib/assert-cashier-cash-method.test.ts` — 7 passed
- `pnpm exec tsc --noEmit -p tsconfig.json` — pass (after tasks 2 and 3)

## Self-Check: PASSED

- FOUND: src/features/accounting/lib/assert-cashier-cash-method.ts
- FOUND: src/features/accounting/lib/assert-cashier-cash-method.test.ts
- FOUND: 16-02-SUMMARY.md
- FOUND: commits 6f9e086, 5e3fb71, a7150d3, b5a6b33
- FOUND: reverse route still `allowedRoles: ['ACCOUNTANT']`

---
*Phase: 16-cashier-role-access*
*Completed: 2026-11-05*
