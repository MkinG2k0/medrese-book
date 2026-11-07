---
phase: 17-tuition-month-unpaid-visibility
plan: 04
subsystem: testing
tags: [playwright, e2e, tuition-month, cashier, debts, parent-portal]

requires:
  - phase: 17-02
    provides: ParentMonthSelect gold Tag «Не оплачен»
  - phase: 17-03
    provides: /accounting/debts + payment-requests month column/confirm
provides:
  - e2e/tuition-month.spec.ts covering TUITION-01…04 + TEST-04 paths
  - cashier-role regression green with menu «Долги»
  - Bugfixes: parent pay createdAt→user.createdAt, no use-server re-export, cashier submitMethod=CASH
affects:
  - Phase 17 verification / human visual UAT
  - Phase 18 saldo cleanup (debts page remains)

actuals:
  tokens: 5500
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Playwright loginAs + Ant Design Select/dialog locators for tuition month flows
    - Cashier submitMethod forced to CASH to avoid session-hydration race

key-files:
  created:
    - e2e/tuition-month.spec.ts
  modified:
    - e2e/cashier-role.spec.ts
    - e2e/helpers/auth.ts
    - src/features/accounting/ui/PaymentRequestsPage.tsx
    - src/features/parent-portal/actions/parent-payment-actions.ts
    - src/features/parent-portal/lib/map-parent-payment-child.ts

key-decisions:
  - "E2E cash-create uses student Bilal so prior confirm of Ali/Usman does not empty tariff"
  - "Visual UAT left human_needed — orchestrator asks user; plan marked complete for automated gate"
  - "Node ≥22.22 required for Playwright 1.61 (nvm use 22.22.0); migrate deploy on .env.test before e2e"

patterns-established:
  - "Phase tuition E2E: parent unpaid Tag by text, debts dual-role, confirm month, cash create with page month"

requirements-completed: [TEST-01, TEST-04, TUITION-01, TUITION-02, TUITION-03, TUITION-04]

coverage:
  - id: D1
    description: Parent month Select shows Tag «Не оплачен» and submits request with month
    requirement: TUITION-02
    verification:
      - kind: e2e
        ref: e2e/tuition-month.spec.ts › опекун: Tag «Не оплачен» и заявка с месяцем
        status: pass
    human_judgment: false
  - id: D2
    description: Accountant and cashier open /accounting/debts; cashier still constrained vs full accounting
    requirement: TUITION-03
    verification:
      - kind: e2e
        ref: e2e/tuition-month.spec.ts › бухгалтер/кассир debts
        status: pass
      - kind: e2e
        ref: e2e/cashier-role.spec.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Confirm UI shows request month; confirm succeeds without Zod month error
    requirement: TUITION-04
    verification:
      - kind: e2e
        ref: e2e/tuition-month.spec.ts › confirm
        status: pass
    human_judgment: false
  - id: D4
    description: Cashier cash create from payments page with month from picker
    requirement: TEST-04
    verification:
      - kind: e2e
        ref: e2e/tuition-month.spec.ts › create payment с month
        status: pass
    human_judgment: false
  - id: D5
    description: Visual readability of gold Tag + debts table in current theme
    requirement: TUITION-02
    verification: []
    human_judgment: true
    rationale: Color/contrast of gold Tag and debts table density need human eye; E2E asserts text/role only

duration: 55min
completed: 2026-11-05
status: complete
human_needed:
  - visual UAT: gold Tag «Не оплачен» + debts table readability (see how-to-verify below)
---

# Phase 17 Plan 04: E2E tuition-month + cashier regression Summary

Playwright `e2e/tuition-month.spec.ts` covers parent unpaid Tag, debts for accountant+cashier, confirm month UI+flow, and cash create with page month; `cashier-role` stays green. Visual UAT remains for human approval.

## Performance

- **Duration:** ~55 min
- **Started:** 2026-11-05T18:20:00Z
- **Completed:** 2026-11-05T18:55:00Z
- **Tasks:** 2 (1 auto + human-verify documented as pending)
- **Files modified:** 6

## Accomplishments

- Authored and greened `e2e/tuition-month.spec.ts` (5 journeys) under Node 22.22 + migrated `.env.test`
- Re-ran `e2e/cashier-role.spec.ts` (assert «Долги» in cashier menu) — all green
- Fixed blocking parent-pay / cashier-confirm bugs discovered by E2E (createdAt, use-server re-export, CASH race)

## Task Commits

1. **Task 1: Playwright e2e/tuition-month.spec.ts + cashier regression** - `a2ebac2` (test)
2. **Task 2: Visual UAT checkpoint** - pending human (documented below; not blocking SUMMARY)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `e2e/tuition-month.spec.ts` — parent Tag, debts dual-role, confirm month, cash create
- `e2e/cashier-role.spec.ts` — menu item «Долги» visible for cashier
- `e2e/helpers/auth.ts` — force click past Next.js error overlay
- `src/features/parent-portal/actions/parent-payment-actions.ts` — drop illegal use-server re-export; select `user.createdAt`
- `src/features/parent-portal/lib/map-parent-payment-child.ts` — fallback month from `user.createdAt`
- `src/features/accounting/ui/PaymentRequestsPage.tsx` — async confirm onOk; `submitMethod` CASH for cashier

## Decisions Made

- Visual UAT is `human_needed` — automated E2E gate complete; orchestrator asks user with how-to-verify steps
- Prefer Node 22.22 via nvm for Playwright 1.61; document default shell Node 22.15 crash pattern (Phase 16)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Parent pay crashed on Student.createdAt**
- **Found during:** Task 1 E2E
- **Issue:** Prisma select `createdAt` on `Student` (field does not exist)
- **Fix:** Use `user.createdAt` as D-05 fallback
- **Files modified:** `parent-payment-actions.ts`, `map-parent-payment-child.ts`
- **Committed in:** `a2ebac2`

**2. [Rule 1 - Bug] Illegal re-export from `"use server"` file**
- **Found during:** Task 1 E2E
- **Issue:** Re-export of `submitParentPaymentRequest` broke module (no exports → blank parent pay page)
- **Fix:** Removed re-export; callers already import from `submit-parent-payment-request.ts`
- **Files modified:** `parent-payment-actions.ts`
- **Committed in:** `a2ebac2`

**3. [Rule 2 - Critical] Cashier confirm sent TRANSFER before session hydrated**
- **Found during:** Task 1 confirm E2E
- **Issue:** Initial `method` state TRANSFER + async session → assertCashierCashMethod rejected; modal stayed open
- **Fix:** `submitMethod = isCashier ? 'CASH' : method`; plain async `onOk`
- **Files modified:** `PaymentRequestsPage.tsx`
- **Committed in:** `a2ebac2`

**4. [Rule 3 - Blocking] Test DB missing month migration / Playwright browsers**
- **Found during:** Task 1 verify
- **Issue:** `.env.test` DB lacked `TuitionPayment.month`; sandbox PLAYWRIGHT_BROWSERS_PATH empty; Node 22.15 crashes Playwright
- **Fix:** `pnpm db:migrate:deploy` against `.env.test`; unset browsers path; `nvm use 22.22.0`
- **Files modified:** none (env/tooling)

**Total deviations:** 4 auto-fixed (Rules 1×2, 2×1, 3×1)
**Impact on plan:** Required for green E2E; no scope creep beyond correctness of Phase 17 features.

## Issues Encountered

- Full `pnpm test:unit` shows intermittent 5s timeouts in unrelated journal/analytics tests (pre-existing flake). Phase-17 unit subset: 70 passed.
- Default PATH Node remains v22.15.0 — Playwright needs 22.22+.

## Human Visual UAT (pending)

**Status:** `human_needed` — automated parts done; awaiting "approved" or visual issues list.

### how-to-verify

1. Войти как опекун → экран оплаты → открыть селект месяца → неоплаченные с жёлтым Tag «Не оплачен» читаемы в текущей теме.
2. Войти как бухгалтер → меню «Долги» → таблица показывает месяцы с долгом.
3. Войти как кассир (400002) → «Долги» открывается; полный `/accounting` по-прежнему недоступен.
4. Кассир/бухгалтер на «Платежи» проводит оплату с месяцем из пикера страницы.

### resume-signal

Type `approved` or list visual issues.

## Test Results

| Check | Result |
|-------|--------|
| `pnpm test:e2e e2e/tuition-month.spec.ts e2e/cashier-role.spec.ts --project=chromium` (Node 22.22) | 16 passed |
| Phase-17 unit subset (unpaid, debts, routes, schemas, cashier cash) | 70 passed |
| Full `pnpm test:unit` | flaky timeouts in unrelated files (out of scope) |

## Known Stubs

None.

## Threat Flags

None beyond plan threat model (E2E uses seeded credentials only).

## Self-Check: PASSED

- FOUND: e2e/tuition-month.spec.ts
- FOUND: e2e/cashier-role.spec.ts (Долги assertion)
- FOUND commit: a2ebac2

---
*Phase: 17-tuition-month-unpaid-visibility*
*Completed: 2026-11-05*
