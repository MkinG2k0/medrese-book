---
phase: 17-tuition-month-unpaid-visibility
plan: 02
subsystem: payments
tags: [parent-portal, unpaid, month-select, antd, vitest]

requires:
  - phase: 17-01
    provides: request/payment.month, ParentPayForm month Select scaffold, parent-pay-draft.month
provides:
  - Pure unpaid-months helpers (isMonthUnpaid, OR aggregation A1, D-05 range)
  - iterateMonths in shared accounting/month
  - ParentPayForm optionRender Tag color=gold «Не оплачен»
  - getParentPaymentPageData per-child charge/paid ledgers + earliestMonth
affects:
  - 17-04 E2E parent yellow unpaid Select
  - 17-03 debts page (shared unpaid math patterns)

actuals:
  tokens: 7862
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Pure unpaid detector + client OR across selected children (A1)
    - Ant Design Select optionRender + Tag color=gold (no hex)
    - Server ledgers (chargesByMonth/paidByMonth) + client flag builders

key-files:
  created:
    - src/features/parent-portal/lib/unpaid-months.ts
    - src/features/parent-portal/lib/unpaid-months.test.ts
    - src/features/parent-portal/lib/useParentPayForm.ts
    - src/features/parent-portal/lib/resolve-parent-pay-initial.ts
    - src/features/parent-portal/lib/map-parent-payment-child.ts
    - src/features/parent-portal/ui/ParentMonthSelect.tsx
    - src/features/parent-portal/ui/ParentPayRequestsList.tsx
    - src/features/parent-portal/actions/submit-parent-payment-request.ts
  modified:
    - src/shared/lib/accounting/month.ts
    - src/features/parent-portal/lib/index.ts
    - src/features/parent-portal/ui/ParentPayForm.tsx
    - src/features/parent-portal/actions/parent-payment-actions.ts
    - src/features/parent-portal/lib/parent-pay-draft.ts

key-decisions:
  - "Tag color=gold for unpaid (locked D-04 discretion)"
  - "Multi-child unpaid = OR across selected children (A1 / D-06)"
  - "Default month = first unpaid in D-05 range else moscowMonthKey"

patterns-established:
  - "Unpaid = charge/tariff > paid for payment.month; partial unpaid"
  - "Parent month Select options built client-side from server ledgers via unpaid-months"

requirements-completed: [TUITION-02, TEST-01]

coverage:
  - id: D1
    description: Pure unpaid + range helpers (partial unpaid, OR, D-05 inclusive)
    requirement: TUITION-02
    verification:
      - kind: unit
        ref: src/features/parent-portal/lib/unpaid-months.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Parent month Select shows gold Tag «Не оплачен» via optionRender
    requirement: TUITION-02
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit -p tsconfig.json
        status: pass
    human_judgment: true
    rationale: Visual gold Tag in dropdown needs human/E2E (17-04); unit+tsc cover logic and types
  - id: D3
    description: Page data supplies charge/paid-by-month; draft persists month
    requirement: TEST-01
    verification:
      - kind: unit
        ref: src/features/parent-portal/lib/unpaid-months.test.ts
        status: pass
      - kind: other
        ref: parent-pay-draft.ts month field (17-01 + retained)
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-05
status: complete
---

# Phase 17 Plan 02: Parent unpaid month Select Summary

**Опекун видит неоплаченные месяцы жёлтым Tag `color="gold"` в селекте; unpaid = charge/тариф не покрыт payment.month (partial тоже), multi-child через OR.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-11-05T18:08:13Z
- **Completed:** 2026-11-05T18:17:22Z
- **Tasks:** 2/2 (TDD helpers + ParentPayForm Select)
- **Files modified:** 13

## Accomplishments

- `iterateMonths` + `unpaid-months` pure helpers with Vitest (10 tests green)
- `getParentPaymentPageData` отдаёт `earliestMonth`, `chargesByMonth`, `paidByMonth` только для детей сессии PARENT (T-17-04)
- `ParentMonthSelect` `optionRender` → `Tag color="gold"` «Не оплачен»; дефолт = первый unpaid else Moscow current
- Draft по-прежнему сохраняет `month`; submit — один month на заявку

## Task Commits

1. **Task 1 RED:** `18ad5c8` (test) — failing unpaid-months tests
2. **Task 1 GREEN:** `6a3406f` (feat) — iterateMonths + unpaid helpers + barrel
3. **Task 2:** `85a26bc` (feat) — page data ledgers + gold Select UX

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/shared/lib/accounting/month.ts` — `iterateMonths`
- `src/features/parent-portal/lib/unpaid-months.ts` — isMonthUnpaid, OR, range, default
- `src/features/parent-portal/lib/unpaid-months.test.ts` — D-05/D-06/A1 coverage
- `src/features/parent-portal/lib/useParentPayForm.ts` — form state + unpaid options
- `src/features/parent-portal/ui/ParentMonthSelect.tsx` — gold Tag optionRender
- `src/features/parent-portal/actions/parent-payment-actions.ts` — charge/paid payload
- `src/features/parent-portal/ui/ParentPayForm.tsx` — wired Select + hook

## Decisions Made

- Locked **Tag `color="gold"`** (not warning/red hex)
- Locked **OR aggregation** across selected children (A1)
- Range end uses **`moscowMonthKey()`**; start = min(charges, enrollments, student.createdAt)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Split ParentPayForm / actions for ≤150 lines**
- **Found during:** Task 2
- **Issue:** Form and actions exceeded project 150-line hard limit after wiring unpaid UX
- **Fix:** Extracted `useParentPayForm`, `ParentMonthSelect`, `ParentPayRequestsList`, `submit-parent-payment-request`, map/hydrate helpers
- **Files modified:** listed above
- **Commit:** `85a26bc`

## Threat Mitigations

| Threat | Disposition | Evidence |
|--------|-------------|---------|
| T-17-04 Parent ownership | mitigate | Ledgers loaded only for `parentId: session.user.id`; submit ownership unchanged |
| T-17-06 Info disclosure | accept | Parent already sees own children rates/charges |

## Known Stubs

None. Visual E2E for gold Tag deferred to 17-04 by phase plan.

## Self-Check: PASSED

- FOUND: src/features/parent-portal/lib/unpaid-months.ts
- FOUND: src/features/parent-portal/ui/ParentMonthSelect.tsx
- FOUND commits: 18ad5c8, 6a3406f, 85a26bc
- Unit tests 10/10 pass; tsc --noEmit exit 0
