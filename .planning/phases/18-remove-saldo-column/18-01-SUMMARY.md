---
phase: 18-remove-saldo-column
plan: 01
subsystem: accounting
tags: [payments, excel, ui, e2e, vitest, saldo]

requires:
  - phase: 17-tuition-month-unpaid-visibility
    provides: accounting payments page + cashier/accountant e2e patterns
provides:
  - StudentPaymentsPage without Сальдо column
  - buildPaymentsWorkbook without Сальдо
  - export-excel unit coverage for payments workbook
  - e2e/payments-saldo.spec.ts + cashier-role regression
affects: [accounting-payments-ui, payments-excel-export]

actuals:
  tokens: 1278
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns: [TDD RED/GREEN for Excel workbook headers, Playwright columnheader absence assert]

key-files:
  created:
    - src/features/accounting/lib/export-excel.test.ts
    - e2e/payments-saldo.spec.ts
  modified:
    - src/features/accounting/lib/export-excel.ts
    - src/features/accounting/ui/StudentPaymentsPage.tsx

key-decisions:
  - "D-01/D-04: remove Сальдо only from UI columns and Excel workbook; keep balanceKopecks in StudentPaymentRow/query"
  - "D-02: Status column and renderStatus unchanged"
  - "ExcelJS Node 22 Buffer typing bridged via `as never` in unit test load helper"

patterns-established:
  - "Payments Excel workbook tested by reloading xlsx Buffer and reading header row cells"

requirements-completed: [PAYUI-01, PAYUI-02, PAYUI-03, TEST-01, TEST-04]

coverage:
  - id: D1
    description: Excel payments workbook has no Сальдо header; Статус remains
    requirement: PAYUI-02
    verification:
      - kind: unit
        ref: src/features/accounting/lib/export-excel.test.ts#does not include Сальдо column and keeps Статус
        status: pass
    human_judgment: false
  - id: D2
    description: Payments UI table has no Сальдо column; Status/renderStatus kept
    requirement: PAYUI-01
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit -p tsconfig.json
        status: pass
      - kind: e2e
        ref: e2e/payments-saldo.spec.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Payment status badges still visible without Saldo column
    requirement: PAYUI-03
    verification:
      - kind: e2e
        ref: e2e/payments-saldo.spec.ts#у кассира нет Сальдо, статус виден
        status: pass
      - kind: unit
        ref: src/features/accounting/lib/export-excel.test.ts
        status: pass
    human_judgment: false
  - id: D4
    description: Autotests for no Saldo in UI/Excel + cashier regression
    requirement: TEST-01
    verification:
      - kind: unit
        ref: src/features/accounting/lib/export-excel.test.ts
        status: pass
      - kind: e2e
        ref: e2e/payments-saldo.spec.ts
        status: pass
    human_judgment: false
  - id: D5
    description: Cashier-role brownfield regression still green
    requirement: TEST-04
    verification:
      - kind: e2e
        ref: e2e/cashier-role.spec.ts
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-07
status: complete
---

# Phase 18 Plan 01: Remove Saldo column Summary

**Payments UI and Excel export no longer show «Сальдо»; status badges remain, and balanceKopecks stays in the query model for debtors/suggestions.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-07T17:18:25Z
- **Completed:** 2026-11-07T17:25:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Removed «Сальдо» from `StudentPaymentsPage` table columns while keeping Status/`renderStatus`
- Removed «Сальдо»/balance from `buildPaymentsWorkbook`; Status column kept
- Added Vitest coverage for workbook headers and Playwright E2E for cashier/accountant
- Confirmed `balanceKopecks` still computed in `query-student-payments` for statuses/debtors

## Task Commits

1. **Task 1 RED: Unit failing test** - `4813803` (test)
2. **Task 1 GREEN: Excel without Saldo** - `a8a4e8c` (feat)
3. **Task 2: UI without Saldo** - `f02b06a` (feat)
4. **Task 3: E2E no Saldo + cashier regression** - `e6fd9d3` (test)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ExcelJS Buffer typing under Node 22**
- **Found during:** Task 2 (`tsc --noEmit`)
- **Issue:** `workbook.xlsx.load(buffer)` failed typecheck: `Buffer<ArrayBufferLike>` vs classic `Buffer`
- **Fix:** Cast via `buffer as never` in test load helper
- **Files modified:** `src/features/accounting/lib/export-excel.test.ts`
- **Commit:** `f02b06a`

**2. [Rule 3 - Blocking] Playwright browsers missing in sandbox cache**
- **Found during:** Task 3 first E2E run
- **Issue:** chromium headless shell missing under cursor-sandbox-cache
- **Fix:** `pnpm exec playwright install chromium`
- **Files modified:** none (local tooling)
- **Commit:** n/a

## TDD Gate Compliance

- RED: `4813803` — test failed while «Сальдо» still in workbook
- GREEN: `a8a4e8c` — workbook updated; unit green

## Verification Results

- `pnpm test:unit src/features/accounting/lib/export-excel.test.ts` — pass
- `pnpm exec tsc --noEmit -p tsconfig.json` — pass
- `pnpm test:e2e e2e/payments-saldo.spec.ts e2e/cashier-role.spec.ts --project=chromium` — 13 passed (Node v22.22.0)

## Known Stubs

None.

## Threat Flags

None — no new endpoints/auth/schema; UI/Excel column removal only (T-18-01 mitigated by keeping status + balanceKopecks).

## Self-Check: PASSED

- Files: export-excel.test.ts, export-excel.ts, StudentPaymentsPage.tsx, payments-saldo.spec.ts, 18-01-SUMMARY.md — FOUND
- Commits: 4813803, a8a4e8c, f02b06a, e6fd9d3 — FOUND
- No «Сальдо» in UI/Excel; balanceKopecks retained in query
