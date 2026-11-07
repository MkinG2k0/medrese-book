---
phase: 17-tuition-month-unpaid-visibility
plan: 03
subsystem: payments
tags: [accounting, debts, rbac, cashier, month, antd]

requires:
  - phase: 17-01
    provides: payment.month attribution, request.month on TuitionPaymentRequest, confirm copies DB month
provides:
  - /accounting/debts page for ACCOUNTANT+CASHIER with unpaid-by-month table
  - ROLE_ROUTES explicit /accounting/debts dual-role prefix
  - AppShell menu «Долги» for accountant and cashier
  - payment-requests list + confirm show request.month (D-09)
affects:
  - 17-04 E2E tuition-month / debts visibility
  - Phase 18 saldo cleanup (debts page remains)

actuals:
  tokens: 3445
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Explicit nested ROLE_ROUTES prefix for CASHIER under ACCOUNTANT-only parent
    - Pure mapTuitionDebtRows + Prisma queryTuitionDebts split (unit-test without DB)
    - Read-only month Tag on payment-requests; confirm content includes month, schema unchanged

key-files:
  created:
    - src/app/(dashboard)/accounting/debts/page.tsx
    - src/features/accounting/ui/TuitionDebtsPage.tsx
    - src/features/accounting/lib/map-tuition-debt-rows.ts
    - src/features/accounting/lib/query-tuition-debts.ts
    - src/features/accounting/lib/query-tuition-debts.test.ts
  modified:
    - src/shared/lib/match-role-route.ts
    - src/shared/lib/match-role-route.test.ts
    - src/widgets/app-shell/ui/AppShell.tsx
    - src/features/accounting/index.ts
    - src/features/accounting/actions/payment-request-actions.ts
    - src/features/accounting/ui/PaymentRequestsPage.tsx

key-decisions:
  - "Path /accounting/debts and menu label «Долги» (locked discretion)"
  - "Split pure mapper from Prisma loader so vitest does not need DATABASE_URL"
  - "Debt rows from charge months only; paid via sumPaidForAttributionMonth; tariff fallback when charge amount nullish"
  - "Confirm modal shows request.month read-only; confirmTuitionPaymentRequestSchema unchanged (T-17-03)"

patterns-established:
  - "Cash-desk nested accounting routes: add explicit ROLE_ROUTES + AppShell entry for both ACCOUNTANT and CASHIER"
  - "Debts attribution uses payment.month, never payment.date calendar month"

requirements-completed: [TUITION-03, TUITION-04, TEST-01, TEST-04]

coverage:
  - id: D1
    description: ROLE_ROUTES /accounting/debts allow ACCOUNTANT+CASHIER; TEACHER deny; CASHIER still deny parent /accounting
    requirement: TUITION-04
    verification:
      - kind: unit
        ref: src/shared/lib/match-role-route.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Unpaid-by-month debt rows use payment.month attribution
    requirement: TUITION-03
    verification:
      - kind: unit
        ref: src/features/accounting/lib/query-tuition-debts.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: /accounting/debts RSC + menu «Долги» for ACCOUNTANT and CASHIER
    requirement: TUITION-03
    verification: []
    human_judgment: true
    rationale: Full browser smoke for dual-role menu/page deferred to 17-04 E2E
  - id: D4
    description: Payment-requests list and confirm show request.month (D-09)
    requirement: TUITION-04
    verification: []
    human_judgment: true
    rationale: UI column/modal covered by code review; E2E in 17-04

duration: 8min
completed: 2026-11-05
status: complete
---

# Phase 17 Plan 03: Debts page + request month Summary

**/accounting/debts** for accountant and cashier with unpaid-by-month table (payment.month attribution), plus request month on payment-requests list and confirm.

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-05T21:08:37Z
- **Completed:** 2026-11-05T21:16:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Explicit `ROLE_ROUTES['/accounting/debts']` so CASHIER is not denied by parent `/accounting`
- Read-only debts table (ученик/опекун/месяц/начислено/оплачено/долг) + menu «Долги»
- Payment-requests DTO/UI expose `month`; confirm dialog shows month without client-editable confirm schema

## Task Commits

1. **Task 1: ROLE_ROUTES + match-role-route tests** - `f489fc6` (test RED) + `7305278` (feat GREEN)
2. **Task 2: queryTuitionDebts + debts page + menu** - `b66e53f` (feat)
3. **Task 3: Show request.month on payment-requests** - `60c4804` (feat)

## Files Created/Modified

- `src/shared/lib/match-role-route.ts` — `/accounting/debts` ACCOUNTANT|CASHIER
- `src/shared/lib/match-role-route.test.ts` — allow/deny matrix
- `src/features/accounting/lib/map-tuition-debt-rows.ts` — pure unpaid-by-month mapper
- `src/features/accounting/lib/query-tuition-debts.ts` — Prisma loader
- `src/features/accounting/lib/query-tuition-debts.test.ts` — mapper unit tests
- `src/features/accounting/ui/TuitionDebtsPage.tsx` — Ant Design table + search
- `src/app/(dashboard)/accounting/debts/page.tsx` — requireRoles + load
- `src/widgets/app-shell/ui/AppShell.tsx` — «Долги» menu for both roles
- `src/features/accounting/actions/payment-request-actions.ts` — list DTO `month`
- `src/features/accounting/ui/PaymentRequestsPage.tsx` — column + confirm text
- `src/features/accounting/index.ts` — barrel export

## Decisions Made

- Split mapper from Prisma loader (Rule 3) so unit tests do not require `DATABASE_URL`
- Charge months drive debt rows; paid sums use `sumPaidForAttributionMonth`
- D-09: display-only month; confirm still copies month from DB (17-01)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split pure mapper from Prisma query for unit tests**
- **Found during:** Task 2
- **Issue:** Importing `query-tuition-debts.ts` in vitest pulled `prisma` and failed with `DATABASE_URL is not set`
- **Fix:** Extracted `map-tuition-debt-rows.ts`; tests import the pure module; loader re-exports types
- **Files modified:** `map-tuition-debt-rows.ts`, `query-tuition-debts.ts`, `query-tuition-debts.test.ts`
- **Commit:** `b66e53f`

### Deferred (out of scope)

- Full-project `tsc` may be red while parallel 17-02 WIP touches parent-portal; 17-03 files have no tsc hits. E2E smoke → 17-04.

## Threat Flags

None — surfaces match plan threat model (T-17-02 ROLE_ROUTES, T-17-07 read-only debts, T-17-03 confirm month display-only).

## Self-Check: PASSED

- FOUND: `src/app/(dashboard)/accounting/debts/page.tsx`
- FOUND: `src/features/accounting/ui/TuitionDebtsPage.tsx`
- FOUND: `src/features/accounting/lib/map-tuition-debt-rows.ts`
- FOUND: `src/features/accounting/lib/query-tuition-debts.ts`
- FOUND: commits `f489fc6`, `7305278`, `b66e53f`, `60c4804`
