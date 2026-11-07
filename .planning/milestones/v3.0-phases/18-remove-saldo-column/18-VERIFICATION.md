---
phase: 18-remove-saldo-column
verified: 2026-11-07T17:28:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
---

# Phase 18: Remove Saldo column Verification Report

**Phase Goal:** Колонка «Сальдо» убрана из таблицы платежей и Excel; статусы оплаты остаются понятными.
**Verified:** 2026-11-07T17:28:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | В UI таблицы платежей нет колонки «Сальдо» | ✓ VERIFIED | `StudentPaymentsPage.tsx` columns: Ученик/Группа/Тариф/Оплачено/Статус/Сумма/actions — нет `title: 'Сальдо'` и нет `key: 'balanceKopecks'` в колонках; grep по accounting UI: «Сальдо» только в unit/e2e asserts |
| 2 | Excel-экспорт платежей не содержит колонку «Сальдо» | ✓ VERIFIED | `buildPaymentsWorkbook` headers: Ученик/Группа/Тариф/Оплачено за месяц/Статус — без balance; API `export/[type]/route.ts` → `buildPaymentsWorkbook`; unit test green |
| 3 | Бейджи/статусы (Аванс, Оплачено, Долг, Частично) остаются без сальдо | ✓ VERIFIED | `renderStatus` + колонка `title: 'Статус'` на месте; Excel `studentStatusLabel` + header «Статус»; e2e asserts columnheader «Статус» + cell `/Оплачено\|Долг\|Аванс\|Частично/` |
| 4 | Автотесты: нет «Сальдо» в UI/Excel; статусы на месте; cashier regression | ✓ VERIFIED | `export-excel.test.ts` (Vitest pass); `e2e/payments-saldo.spec.ts` (cashier+accountant); SUMMARY: `cashier-role.spec.ts` 13 passed на Node 22.22 |
| 5 | `balanceKopecks` остаётся в `StudentPaymentRow` / query для статусов/debtors/suggestions | ✓ VERIFIED | `query-student-payments.ts` type + `computeStudentBalanceKopecks` + `resolveStudentPaymentStatus`; debtors filter `balanceKopecks < 0`; `payment-suggestions.ts` uses `row.balanceKopecks` |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/features/accounting/ui/StudentPaymentsPage.tsx` | No Saldo column; Status kept | ✓ VERIFIED | Columns without Сальдо; `renderStatus` wired |
| `src/features/accounting/lib/export-excel.ts` | `buildPaymentsWorkbook` without Сальдо | ✓ VERIFIED | 5 columns, status only |
| `src/features/accounting/lib/export-excel.test.ts` | Unit: no Сальдо, has Статус | ✓ VERIFIED | 1 test, spot-check PASS |
| `e2e/payments-saldo.spec.ts` | E2E no Saldo columnheader | ✓ VERIFIED | Cashier + accountant scenarios |
| `src/features/accounting/lib/query-student-payments.ts` | balanceKopecks retained | ✓ VERIFIED | Field + computation + debtors filter |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| StudentPaymentsPage columns | UI table | `useMemo` columns array | ✓ WIRED | No Saldo column definition |
| StudentPaymentsPage Excel button | `/api/accounting/export/payments` | `handleExport` fetch | ✓ WIRED | Accountant-only button |
| export route payments | `buildPaymentsWorkbook` | `queryStudentPaymentsForMonth` → workbook | ✓ WIRED | Real query, not mock |
| `resolveStudentPaymentStatus` | Status Tags | `renderStatus(row.status)` | ✓ WIRED | Uses balanceKopecks from query |
| debtKopecks / suggestPaymentAmount | inline pay | `payment-suggestions.ts` | ✓ WIRED | Still reads `balanceKopecks` |
| payments-saldo.spec | `/accounting/payments` | loginAs cashier/accountant | ✓ WIRED | columnheader asserts |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| StudentPaymentsPage Status | `row.status` | `queryStudentPaymentsForMonth` → Prisma charges/payments → `resolveStudentPaymentStatus(balanceKopecks, …)` | Yes | ✓ FLOWING |
| Excel Status cell | `studentStatusLabel(row.status)` | same StudentPaymentRow | Yes | ✓ FLOWING |
| debtorsOnly filter | `row.balanceKopecks < 0` | computed balance | Yes | ✓ FLOWING |
| Saldo column | — | removed | N/A | ✓ ABSENT (intentional) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Excel workbook no Сальдо / keeps Статус | `pnpm test:unit src/features/accounting/lib/export-excel.test.ts` | 1 passed | ✓ PASS |
| UI source has no Сальдо column title | grep `Сальдо` in `StudentPaymentsPage.tsx` | 0 matches | ✓ PASS |
| balanceKopecks still computed | grep in `query-student-payments.ts` | type + compute + filter present | ✓ PASS |
| E2E file asserts no Saldo | read `e2e/payments-saldo.spec.ts` | columnheader count 0 + Статус | ✓ PASS (file; suite not re-run this session) |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| PAYUI-01 | 18-01 | Нет колонки «Сальдо» в UI | ✓ SATISFIED | StudentPaymentsPage columns |
| PAYUI-02 | 18-01 | Excel без «Сальдо» | ✓ SATISFIED | buildPaymentsWorkbook + unit |
| PAYUI-03 | 18-01 | Статусы без сальдо | ✓ SATISFIED | renderStatus + Excel status |
| TEST-01 | 18-01 | Покрытие Saldo UI+Excel | ✓ SATISFIED | unit + payments-saldo e2e |
| TEST-04 | 18-01 | Cashier brownfield regression | ✓ SATISFIED | e2e/cashier-role.spec.ts (SUMMARY green Node 22.22) |

No orphaned Phase 18 requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase files | — | — |
| StudentPaymentsPage.tsx | placeholders | Input `placeholder=` only | ℹ️ Info | Not stubs |

### Human Verification Required

None — structural absence + unit pass + e2e coverage files are sufficient for this phase goal. Optional smoke: open `/accounting/payments` as ACCOUNTANT and confirm table/Excel visually.

### Gaps Summary

No gaps. Phase goal achieved.

---

_Verified: 2026-11-07T17:28:00Z_
_Verifier: Claude (gsd-verifier)_
