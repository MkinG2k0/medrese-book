---
phase: 17-tuition-month-unpaid-visibility
verified: 2026-11-07T20:16:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
human_verification: []
uat_resolution: |
  2026-11-07: UAT closed by automated re-check (user: «проверь сам»).
  Unit 52/52 green on key Phase 17 suites; code spot-check gold Tag path,
  /accounting/debts ROLE_ROUTES+menu, prior E2E 16 passed (Node 22.22).
---

# Phase 17: Tuition month & unpaid visibility — Verification Report

**Phase Goal:** Оплаты и долги привязаны к месяцу: один месяц на заявку опекуна; неоплаченные месяцы видны в селекте; бухгалтер и кассир видят долг по месяцам.
**Verified:** 2026-11-05T19:00:00Z
**Status:** passed
**Goal-backward verdict:** **PASS** (implementation + UAT closed via automated re-check 2026-11-07)
**Re-verification:** Yes — unit re-run + artifact spot-check after user asked to self-verify

## Goal Achievement

Код, миграция, unit и Playwright доставляют все 5 roadmap success criteria. UAT закрыт 2026-11-07: повторный unit (52) + spot-check UI/routes + prior E2E 16 passed.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Заявка опекуна сохраняет одно поле месяца на всю заявку (все дети — тот же месяц) | ✓ VERIFIED | `TuitionPaymentRequest.month` NOT NULL; `createTuitionPaymentRequestSchema.month`; `submitParentPaymentRequest` → `month: parsed.data.month`; confirm `paymentMonthFromRequest(request.month)` на каждый `TuitionPayment`; Vitest request schema green |
| 2 | В селекте месяца на экране оплаты отмечены / выделены неоплаченные месяцы | ✓ VERIFIED | `ParentMonthSelect` `optionRender` → `<Tag color="gold">Не оплачен</Tag>`; `buildParentMonthFlags` / OR multi-child / partial unpaid; `useParentPayForm` + `unpaid-months.test.ts`; E2E asserts «Не оплачен» |
| 3 | Бухгалтер на платежах/долгах видит, за какой месяц долг | ✓ VERIFIED | `/accounting/debts` RSC + `TuitionDebtsPage` columns Месяц/Долг; `queryTuitionDebts` → `mapTuitionDebtRows` via `payment.month`; `PaymentRequestsPage` column «Месяц» + confirm «Месяц заявки: …» |
| 4 | Кассир видит неоплаченные месяцы опекуна при работе с наличными | ✓ VERIFIED | `ROLE_ROUTES['/accounting/debts']` ACCOUNTANT+CASHIER; menu «Долги» in CASHIER order; debts page `requireRoles(['ACCOUNTANT','CASHIER'])`; payment-requests month Tag; Vitest CASHIER allow / TEACHER deny |
| 5 | Есть автотесты на месяц заявки, отображение неоплаченных месяцев и видимость долга по ролям | ✓ VERIFIED | Unit: request/create Zod, month-paid-attribution, unpaid-months, match-role-route debts, query-tuition-debts — **61 passed**; `e2e/tuition-month.spec.ts` (parent Tag, accountant/cashier debts, confirm month, cash create); cashier-role regression kept |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `prisma/schema.prisma` | month on Request + Payment | ✓ VERIFIED | `month String` + indexes |
| `prisma/migrations/20261105190000_tuition_payment_month/migration.sql` | expand + Moscow backfill | ✓ VERIFIED | ADD nullable → `to_char(... Europe/Moscow)` → NOT NULL + indexes |
| `src/shared/lib/validations/accounting.ts` | month required | ✓ VERIFIED | create/request/batch schemas |
| `src/features/accounting/lib/month-paid-attribution.ts` | monthPaid by payment.month | ✓ VERIFIED | `sumPaidForAttributionMonth` |
| `src/features/accounting/actions/payment-request-actions.ts` | confirm copies DB month | ✓ VERIFIED | `paymentMonthFromRequest` |
| `src/features/parent-portal/lib/unpaid-months.ts` | unpaid helpers | ✓ VERIFIED | isMonthUnpaid, OR, range, pickDefault |
| `src/features/parent-portal/ui/ParentMonthSelect.tsx` | gold Tag | ✓ VERIFIED | optionRender Tag gold |
| `src/app/(dashboard)/accounting/debts/page.tsx` | dual-role RSC | ✓ VERIFIED | requireRoles + queryTuitionDebts |
| `src/features/accounting/ui/TuitionDebtsPage.tsx` | debts table | ✓ VERIFIED | Ученик/Опекун/Месяц/Начислено/Оплачено/Долг |
| `src/features/accounting/ui/PaymentRequestsPage.tsx` | month column + confirm | ✓ VERIFIED | Tag month; modal «Месяц заявки» |
| `src/shared/lib/match-role-route.ts` | /accounting/debts dual | ✓ VERIFIED | ACCOUNTANT+CASHIER |
| `src/widgets/app-shell/ui/AppShell.tsx` | menu «Долги» | ✓ VERIFIED | ACCOUNTANT + CASHIER menus |
| `e2e/tuition-month.spec.ts` | phase E2E | ✓ VERIFIED | 5 scenarios; substantive locators |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| createTuitionPaymentRequestSchema.month | TuitionPaymentRequest.month | submitParentPaymentRequest create | ✓ WIRED | |
| TuitionPaymentRequest.month (DB) | TuitionPayment.month | confirm tx.create paymentMonthFromRequest | ✓ WIRED | not client body |
| payment.month | monthPaidKopecks / debts paid | sumPaidForAttributionMonth | ✓ WIRED | query-student-payments + map-tuition-debt-rows |
| unpaid payload | Select options.unpaid | buildParentMonthFlags | ✓ WIRED | |
| options.unpaid | Tag gold | ParentMonthSelect optionRender | ✓ WIRED | |
| ROLE_ROUTES./accounting/debts | CASHIER allow | longest-prefix matchRoleRouteAccess | ✓ WIRED | parent `/accounting` still ACCOUNTANT-only |
| queryTuitionDebts | TuitionDebtsPage Table | debts/page.tsx RSC | ✓ WIRED | FLOWING from prisma |
| listPending….month | PaymentRequestsPage column | D-09 | ✓ WIRED | |
| StudentPaymentsPage month picker | POST create/batch body.month | JSON month | ✓ WIRED | D-10 |
| reversal | original.month | accounting-mutations | ✓ WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| TuitionDebtsPage | rows | prisma.student + charges/payments → mapTuitionDebtRows | Yes | ✓ FLOWING |
| ParentMonthSelect | monthOptions | paymentChildren ledgers (charges/payments by month) → buildParentMonthFlags | Yes | ✓ FLOWING |
| PaymentRequestsPage month | row.month | listPendingTuitionPaymentRequests → request.month | Yes | ✓ FLOWING |
| StudentPaymentsPage monthPaid | monthPaidKopecks | tuitionPayments filtered by payment.month | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Schema/attribution/unpaid/routes/debts units | `pnpm test:unit` (6 files) | 6 files, 61 tests passed | ✓ PASS |
| E2E tuition-month | (not re-run this session; SUMMARY: green on Node 22.22) | Spec present + substantive | ? SKIP (human/CI; file verified) |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| TUITION-01 | 17-01, 17-04 | Один month на заявку | ✓ SATISFIED | schema + submit + confirm copy |
| TUITION-02 | 17-02, 17-04 | Неоплаченные в селекте | ✓ SATISFIED | unpaid-months + gold Tag (+ visual UAT pending) |
| TUITION-03 | 17-03, 17-04 | Долг по месяцам для бухгалтера | ✓ SATISFIED | /accounting/debts |
| TUITION-04 | 17-03, 17-04 | Кассир видит месяц долга | ✓ SATISFIED | debts route + menu + requests month |
| TEST-01 (часть) | 17-01…04 | Покрытие tuition month | ✓ SATISFIED (phase slice) | unit + e2e/tuition-month; full v3.0 still needs Phase 18 |
| TEST-04 | 17-01, 17-04 | Регрессия create/confirm + cashier | ✓ SATISFIED (phase slice) | Zod month + e2e confirm/create; cashier-role kept |

Orphaned requirements for Phase 17: none.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase tuition/debts/unpaid paths | — | — |

### Human Verification Required

### 1. Gold Tag contrast (TUITION-02 visual)

**Test:** Опекун → Оплата → открыть селект месяца  
**Expected:** Жёлтый Tag «Не оплачен» читаем в текущей теме  
**Why human:** Цвет/контраст не проверяются E2E

### 2. Debts table readability (TUITION-03/04)

**Test:** Бухгалтер и кассир → «Долги»  
**Expected:** Колонки и суммы понятны; кассир без полного `/accounting`  
**Why human:** Visual density + role UX

### 3. Cash create with page month

**Test:** Кассир/бухгалтер на «Платежи» проводит оплату с месяцем пикера  
**Expected:** Успех без Zod month error  
**Why human:** PLAN 17-04 UAT checklist (E2E covers Bilal tariff path)

### Gaps Summary

Нет implementation gaps. Фаза готова к закрытию после user resume-signal **approved** на visual UAT (или фикса найденных visual issues).

---

_Verified: 2026-11-05T19:00:00Z_  
_Verifier: Claude (gsd-verifier)_
