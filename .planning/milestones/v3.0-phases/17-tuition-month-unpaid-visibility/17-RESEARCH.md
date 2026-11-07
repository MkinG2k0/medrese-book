# Phase 17: Tuition month & unpaid visibility - Research

**Researched:** 2026-11-05  
**Domain:** Tuition attribution by calendar month (Prisma + parent portal + accounting cash desk)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Привязка платежа к месяцу (TUITION-01 + модель данных)
- **D-01:** На `TuitionPaymentRequest` — одно поле `month` (`YYYY-MM`) на всю заявку; все строки заявки относятся к этому месяцу. — **Reversibility:** one-way — Prisma column + backfill/API contract
- **D-02:** На `TuitionPayment` — явное поле `month` (целевой месяц оплаты). При confirm заявки месяц копируется с request на создаваемые платежи. Учёт «оплачено за месяц» идёт по `payment.month`, **не** по календарной дате платежа. — **Reversibility:** one-way — миграция + пересчёт monthPaid / статусов
- **D-03:** Существующие платежи без month: backfill из календарного месяца `date` (Moscow/`monthKey` по принятому в accounting паттерну). — **Reversibility:** one-way — data migration

### Селект неоплаченных у опекуна (TUITION-02)
- **D-04:** На экране оплаты опекуна — селект/пикер месяца; неоплаченные месяцы помечены **жёлтым индикатором** (Tag/dot в option label). Один выбранный месяц на заявку.
- **D-05:** Диапазон месяцев в селекте: от первого charge/enrollment ребёнка(детей) до текущего месяца (включ.); детали границ — на усмотрение реализации, если не противоречит D-04.
- **D-06:** «Неоплачен» = за месяц есть начисление (charge или тариф как charge) и сумма платежей с `month === этот месяц` по выбранным детям **не покрывает** начисление (partial тоже считается неоплаченным для индикатора).

### Долг по месяцам — отдельная страница (TUITION-03, TUITION-04)
- **D-07:** Бухгалтер и кассир видят долг **по месяцам** на **отдельной странице** (не только колонка в существующей таблице платежей). Страница в зоне accounting; доступ `ACCOUNTANT` + `CASHIER` (кассир — read для понимания «за какой месяц не оплатил» при работе с кассой). — **Reversibility:** costly — новый route + menu + guards
- **D-08:** На странице видно разбивку долга по месяцам (ученик/опекун → месяцы с непокрытым начислением и суммами). Точная denseness таблицы vs карточки — Claude's discretion в рамках существующих Ant Design паттернов accounting.
- **D-09:** В списке заявок (`/accounting/payment-requests`) и при confirm показывать `month` заявки (контекст для кассира/бухгалтера). Не заменяет отдельную страницу долгов (D-07).

### Прямой приём наличных (кассир/бухгалтер без заявки)
- **D-10:** Создание tuition payment с экрана «Платежи» требует обязательный выбор `month` (и для CASHIER, и для ACCOUNTANT). Метод для кассира по-прежнему только CASH (Phase 16). — **Reversibility:** costly — UI + API validation

### Тесты (TEST-01/04, D-M6)
- **D-11:** В той же фазе: unit на schema/attribution (month на request+payment, unpaid detection); E2E — опекун выбирает месяц с жёлтым индикатором неоплаченного; бухгалтер/кассир видят отдельную страницу долга по месяцам; регрессия create/confirm с month.

### Claude's Discretion
- Точный path страницы долгов (например `/accounting/debts` или `/accounting/tuition-debts`) и пункт меню («Долги» / «Долги по месяцам»)
- Layout страницы долгов (таблица / группировка по ученику)
- Компонент жёлтого индикатора в option (antd Tag `gold`/`warning` vs цветная точка)
- Нужен ли month в Excel-экспорте платежей в этой фазе — **нет**, пока не мешает; Excel «Сальдо» — Phase 18
- Фильтры на странице долгов (группа, поиск) — минимально достаточные

### Deferred Ideas (OUT OF SCOPE)
- Убрать колонку «Сальдо» из UI и Excel — Phase 18
- ЗП формула / UI-конфиг параметров — v3.1
- Обязательный month в Excel-экспорте платежей — не в Phase 17, если не блокирует
- Партнёр / пожертвования — v3.3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUITION-01 | Заявка опекуна содержит один месяц на всю заявку | Prisma `TuitionPaymentRequest.month`; Zod `createTuitionPaymentRequestSchema` + `month`; ParentPayForm single month select; confirm copies to payments |
| TUITION-02 | В селекте месяца видны неоплаченные | Pure unpaid detector (D-06) + Select `optionRender` yellow Tag; month range D-05 |
| TUITION-03 | Бухгалтер видит долг по месяцам | Separate `/accounting/debts` page + query unpaid-by-month; ROLE_ROUTES + menu ACCOUNTANT |
| TUITION-04 | Кассир видит, за какой месяц не оплатил | Same debts page dual-role; show `month` on payment-requests (D-09); cash create requires month (D-10) |
| TEST-01 (часть) | Покрывающие тесты волны | Unit schema/attribution/unpaid + E2E parent yellow + debts visibility |
| TEST-04 | Регрессия brownfield tuition | Update request schema tests; create/confirm with month; keep cashier-role matrix green |
</phase_requirements>

## Summary

Phase 17 switches tuition **attribution** from “calendar date of the payment row” to an explicit `YYYY-MM` on both `TuitionPaymentRequest` and `TuitionPayment`. Today `TuitionCharge` already stores `month`, but `TuitionPayment` / request have no month field, parent pay has no month UI, confirm creates payments without month, and `queryStudentPaymentsForMonth` computes `monthPaidKopecks` by filtering `payment.date` into `monthKeyToDateRange(month)` — which contradicts D-02. [VERIFIED: prisma/schema.prisma:342-388] [VERIFIED: src/features/accounting/lib/query-student-payments.ts:26-57] [VERIFIED: src/features/parent-portal/ui/ParentPayForm.tsx:110-132]

Implementation stays inside the existing stack: Prisma SQL migrate (nullable → backfill → NOT NULL), Zod `monthSchema` already present, FSD feature modules (`parent-portal`, `accounting`), dual cash-desk roles from Phase 16, Ant Design Select/`Tag`, Vitest + Playwright. No new npm packages.

**Primary recommendation:** Add `month` to request + payment (mirror `TuitionCharge.month`), backfill from Moscow calendar of `date`/`createdAt`, switch all monthPaid/unpaid logic to `payment.month`, then ship parent unpaid Select + `/accounting/debts` for ACCOUNTANT+CASHIER with unit+E2E in the same phase.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persist request/payment `month` | Database / Storage | API / Backend | Prisma columns + migration own source of truth |
| Validate month on create/confirm | API / Backend | — | Zod + server actions / API routes |
| Parent month select + yellow unpaid | Browser / Client | Frontend Server (SSR data) | Client Select; unpaid flags from server action payload |
| Unpaid / debts-by-month query | API / Backend | Database / Storage | Pure lib + Prisma aggregates; RSC page loads |
| Cash desk create with month | Browser / Client | API / Backend | StudentPaymentsPage posts `month`; schema requires it |
| Role access to debts page | Frontend Server (SSR) + middleware | Browser | `ROLE_ROUTES` + `requireRoles` + AppShell menu |
| Tests | — | — | Vitest pure logic; Playwright role journeys |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma + `@prisma/client` | 7.8.0 (repo) | Schema + SQL migrations | Existing persistence; ADD COLUMN pattern already used |
| Zod | 4.3.6 (repo) | `month` on create/request/batch schemas | Already in `accounting.ts` |
| Next.js App Router | 16.1.6 | RSC pages + server actions + API | Existing accounting/parent routes |
| Ant Design | 6.4.3 (repo; docs 6.5.0 API compatible) | Select, Tag, Table | `optionRender` for yellow unpaid [CITED: ant-design Select props] |
| Vitest | ^4.1.9 | Unit tests | Existing `test:unit` |
| Playwright | ^1.61.0 | E2E | Existing `e2e/cashier-role.spec.ts` pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dayjs` | 1.11.x (repo) | Month labels in UI | Parent Select / debts display |
| `@/shared/lib/accounting/month` | in-repo | `YYYY-MM` helpers | Ranges, current month |
| `@/shared/lib/moscow-date` | in-repo | Moscow month for backfill/current | D-03 / D-05 “Moscow/monthKey” |
| `exceljs` | 4.4.x | Payment export | **Do not** add month column this phase (discretion) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Explicit `payment.month` | Infer from `date` forever | Rejected by D-02 (pay today for past month) |
| Debts embedded in payments table | Separate page | Rejected by D-07 |
| New debt-status package | Pure TS helpers | Unnecessary; keep KISS |

**Installation:** none — no new packages.

**Version verification:** versions taken from repo `package.json` (already installed). No registry installs planned.

## Package Legitimacy Audit

> Phase installs **no** external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | N/A |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Project Constraints (from .cursor/rules/)

Actionable directives relevant to this phase:

- **prisma-migrations:** commit `schema.prisma` + `prisma/migrations/...`; SQL only safe ops (`ADD COLUMN`, indexes); no `DROP`/`DELETE` without user ask; on test/prod use `migrate deploy` only — never `migrate reset` / `db seed` / `db push`.
- **new-module-tests:** new feature/page/API flow → Playwright `e2e/<module>.spec.ts` in the same change; role coverage + happy path; use `TEST_CODES` / helpers; Ant Design locators via roles/titles.
- **antd-app-context:** use `App.useApp()` for `message`/`modal` — no static `message`/`Modal.confirm` imports.
- **antd-no-style-overrides:** no hardcoded colors on antd Text/Title; yellow unpaid via Ant Design `Tag` color (`gold`/`warning`), not Tailwind hex on Tag.
- **no-antd-flex:** layout with `div` + Tailwind flex utilities, not `<Flex>`.

## Architecture Patterns

### System Architecture Diagram

```text
Parent (Browser)
  └─ ParentPayForm month Select (yellow unpaid options)
       └─ submitParentPaymentRequest({ month, lines })
            └─ Zod createTuitionPaymentRequestSchema
                 └─ Prisma TuitionPaymentRequest(+lines) [month]

Cash desk ACCOUNTANT|CASHIER
  ├─ StudentPaymentsPage (month from URL picker → POST body)
  │    └─ POST /api/accounting/payments[|/batch] { ..., month }
  │         └─ createTuitionPayment(s) → TuitionPayment.month
  ├─ PaymentRequestsPage (show request.month)
  │    └─ confirmTuitionPaymentRequest
  │         └─ copy request.month → each TuitionPayment.month
  └─ /accounting/debts (read)
       └─ queryUnpaidByMonth → Table (student/parent → months/amounts)

Shared attribution
  TuitionCharge.month ──┐
  TuitionPayment.month ─┴─ unpaid? charge(or rate) > sum(payments for month)
  queryStudentPaymentsForMonth.monthPaid ← filter payment.month === month
                                         (NOT date range)
```

### Recommended Project Structure

```text
prisma/schema.prisma                          # month on Request + Payment
prisma/migrations/..._tuition_payment_month/  # ADD + backfill + NOT NULL + indexes

src/shared/lib/validations/accounting.ts      # require month on create/request/batch
src/shared/lib/accounting/month.ts            # reuse; optional iterateMonths helper
src/shared/lib/match-role-route.ts            # /accounting/debts dual roles
src/widgets/app-shell/ui/AppShell.tsx          # menu item for ACCOUNTANT+CASHIER

src/features/parent-portal/
  lib/unpaid-months.ts                        # pure unpaid + range builders
  lib/unpaid-months.test.ts
  ui/ParentPayForm.tsx                        # month Select + optionRender
  actions/parent-payment-actions.ts           # persist month; expose unpaid flags

src/features/accounting/
  lib/query-student-payments.ts               # monthPaid by payment.month
  lib/query-tuition-debts.ts                  # debts-by-month rows
  lib/accounting-mutations.ts                 # write month; reversal copies month
  actions/payment-request-actions.ts          # list/confirm with month
  ui/StudentPaymentsPage.tsx                  # send month on create/batch
  ui/PaymentRequestsPage.tsx                  # column month
  ui/TuitionDebtsPage.tsx                     # new page UI

src/app/(dashboard)/accounting/debts/page.tsx # requireRoles ACCOUNTANT|CASHIER

e2e/tuition-month.spec.ts                     # parent yellow + debts + regression
src/shared/lib/validations/tuition-payment-request.test.ts  # require month
src/shared/lib/match-role-route.test.ts       # debts allow/deny matrix
```

### Pattern 1: Expand column with backfill (project SQL style)
**What:** Nullable ADD → UPDATE backfill → SET NOT NULL + index.  
**When to use:** Adding required `month` to existing payment/request rows (D-01…D-03).  
**Example:** [VERIFIED: prisma/migrations/20260707180000_add_subject/migration.sql:16-21]

```sql
ALTER TABLE "Level" ADD COLUMN "subjectId" TEXT;
UPDATE "Level" SET "subjectId" = 'clq10defaultquransubject00';
ALTER TABLE "Level" ALTER COLUMN "subjectId" SET NOT NULL;
```

Recommended Phase 17 SQL shape (planner/executor fill exact statements):

```sql
ALTER TABLE "TuitionPayment" ADD COLUMN "month" TEXT;
UPDATE "TuitionPayment"
SET "month" = to_char(("date" AT TIME ZONE 'Europe/Moscow'), 'YYYY-MM');
ALTER TABLE "TuitionPayment" ALTER COLUMN "month" SET NOT NULL;
CREATE INDEX "TuitionPayment_studentId_month_idx" ON "TuitionPayment"("studentId", "month");

ALTER TABLE "TuitionPaymentRequest" ADD COLUMN "month" TEXT;
UPDATE "TuitionPaymentRequest"
SET "month" = to_char(("createdAt" AT TIME ZONE 'Europe/Moscow'), 'YYYY-MM');
ALTER TABLE "TuitionPaymentRequest" ALTER COLUMN "month" SET NOT NULL;
CREATE INDEX "TuitionPaymentRequest_month_idx" ON "TuitionPaymentRequest"("month");
```

Prisma docs also describe expand via addColumn → dataTransform → setNotNull [CITED: prisma.io/docs/orm/migrations/editing-a-migration]. **Use the repo’s SQL file pattern**, not the newer TS Migration class — this codebase’s migrator runs `prisma migrate deploy` on SQL folders.

### Pattern 2: monthPaid attribution by payment.month
**What:** Sum payments where `payment.month === selectedMonth` (include negative reversals that share month).  
**When to use:** `queryStudentPaymentsForMonth`, unpaid detector, debts page.  
**Anti-pattern:** Filtering by `date` range after D-02.

Current (replace): [VERIFIED: src/features/accounting/lib/query-student-payments.ts:55-57]

```typescript
const monthPaidKopecks = student.tuitionPayments
  .filter((payment) => payment.date >= start && payment.date <= end)
  .reduce((sum, payment) => sum + payment.amount, 0)
```

Target:

```typescript
const monthPaidKopecks = student.tuitionPayments
  .filter((payment) => payment.month === month)
  .reduce((sum, payment) => sum + payment.amount, 0)
```

### Pattern 3: Parent unpaid Select with optionRender
**What:** Build `{ value, label, unpaid }` options; render yellow Tag when unpaid.  
**When to use:** ParentPayForm month control (D-04/D-06).  
**Example:** Ant Design Select `optionRender` [CITED: ant-design/ant-design Select props / optionRender 5.11+]

```tsx
<Select
  value={month}
  options={monthOptions}
  optionRender={(option) => (
    <span className="flex items-center justify-between gap-2">
      <span>{option.data.label}</span>
      {option.data.unpaid ? <Tag color="gold">Не оплачен</Tag> : null}
    </span>
  )}
/>
```

Discretion recommendation: `Tag color="gold"` (yellow, not red).

### Pattern 4: Dual-role accounting nested route
**What:** Explicit longer prefix in `ROLE_ROUTES` for CASHIER+ACCOUNTANT; menu entry in both role orders.  
**When to use:** New debts page (D-07).  
**Why critical:** `/accounting` is ACCOUNTANT-only; without `/accounting/debts` entry, longest-prefix match denies CASHIER. [VERIFIED: src/shared/lib/match-role-route.ts:17-20]

### Anti-Patterns to Avoid
- **Inferring attribution month from `operationDate`:** breaks “pay today for September” (D-02/D-10). Send explicit `month` from page picker / parent select.
- **Embedding debts only as a column on payments table:** violates D-07.
- **Skipping month on reverse rows:** reversal without `original.month` corrupts monthPaid.
- **Red unpaid styling:** locked yellow indicator (D-04 / specifics).
- **Excel month/Saldo work:** Phase 18 / deferred.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month string format | Custom parsers | Existing `monthSchema` + `parseMonthKey` | Already validated `YYYY-MM` |
| Month ranges | Ad-hoc loops in UI | Pure `iterateMonths(from, to)` helper next to `month.ts` | Testable; shared by parent + debts |
| Unpaid detection | Inline JSX math | Pure function in `parent-portal/lib` or `accounting/lib` | Unit-testable (D-11) |
| Role gating | Ad-hoc checks only in UI | `ROLE_ROUTES` + `requireRoles` + Vitest matrix | Phase 16 pattern |
| Yellow option chrome | Custom CSS hex | antd `Tag color="gold"` / `warning` | Theme-safe; rules forbid style overrides |

**Key insight:** Attribution is a **data model** change; UI indicators are thin consumers of a pure unpaid function.

## Runtime State Inventory

> Migration phase — runtime data must be backfilled.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | All `TuitionPayment` rows lack `month`; all `TuitionPaymentRequest` rows lack `month` [VERIFIED: prisma/schema.prisma:354-388] | SQL backfill in migration (payments from `date`; requests from `createdAt` Moscow) |
| Live service config | None specific to tuition month (Dokploy env unchanged) | None — verified by phase scope (no new env keys) |
| OS-registered state | None | None — verified (code/DB only) |
| Secrets/env vars | No new keys; existing `DATABASE_URL` | None |
| Build artifacts | `generated/prisma/` after schema change | `prisma generate` / postinstall; do not commit generated if gitignored |

## Common Pitfalls

### Pitfall 1: monthPaid still uses date range
**What goes wrong:** Paying on 5 Nov for September still looks unpaid for September.  
**Why it happens:** Current filter uses `monthKeyToDateRange` on `date`. [VERIFIED: src/features/accounting/lib/query-student-payments.ts:55-57]  
**How to avoid:** Switch select + unpaid + debts queries to `payment.month`; add unit tests where `date` month ≠ `payment.month`.  
**Warning signs:** Integration tests that only set `date` without asserting `month`.

### Pitfall 2: CASHIER denied on `/accounting/debts`
**What goes wrong:** Middleware redirects cashier away from debts.  
**Why it happens:** Parent prefix `/accounting` is ACCOUNTANT-only. [VERIFIED: src/shared/lib/match-role-route.ts:17-20]  
**How to avoid:** Add explicit `ROLE_ROUTES['/accounting/debts'] = ['ACCOUNTANT','CASHIER']` + menu + match-role-route tests.  
**Warning signs:** E2E cashier deep-link lands on payments redirect.

### Pitfall 3: Confirm creates payments without month
**What goes wrong:** Confirmed requests produce attribution-less payments.  
**Why it happens:** Current create loop only sets studentId/date/amount/method. [VERIFIED: src/features/accounting/actions/payment-request-actions.ts:120-129]  
**How to avoid:** `month: request.month` on every created payment; fail confirm if request.month missing (should be NOT NULL post-migrate).

### Pitfall 4: Batch/quick-pay omit month
**What goes wrong:** Zod rejects or writes null after schema change.  
**Why it happens:** `postPayment` / batch body currently has no `month`. [VERIFIED: src/features/accounting/ui/StudentPaymentsPage.tsx:143-154]  
**How to avoid:** Pass page `month` prop into single + batch + quickPay payloads; schema `.month: monthSchema` required.

### Pitfall 5: Reversal drops month
**What goes wrong:** Storno doesn’t reduce that month’s paid sum.  
**Why it happens:** `reverseTuitionPayment` copies method/student but not a month field today. [VERIFIED: src/features/accounting/lib/accounting-mutations.ts:126-137]  
**How to avoid:** Set `month: original.month` on reversal row.

### Pitfall 6: Parent draft without month
**What goes wrong:** After refresh, unpaid month selection lost.  
**Why it happens:** Draft type is only selectedStudentIds + amounts. [VERIFIED: src/features/parent-portal/lib/parent-pay-draft.ts:3-6]  
**How to avoid:** Extend draft with optional `month`; default to first unpaid or current month.

### Pitfall 7: Charge missing → false “paid”
**What goes wrong:** Months before charge generation look paid.  
**Why it happens:** D-06 says charge **or tariff as charge** (same fallback as payments query). [VERIFIED: src/features/accounting/lib/query-student-payments.ts:52-54]  
**How to avoid:** Unpaid helper uses `charge?.amount ?? tuitionRate` when evaluating coverage.

## Code Examples

### Schema shape (mirror charge)
[VERIFIED: prisma/schema.prisma:342-351] — charge already has:

```prisma
model TuitionCharge {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  month     String
  amount    Int
  createdAt DateTime @default(now())

  @@unique([studentId, month])
  @@index([month])
}
```

Add analogous required `month String` (+ indexes) on `TuitionPayment` and `TuitionPaymentRequest`.

### Zod — require month on request + payment
Existing private `monthSchema` [VERIFIED: src/shared/lib/validations/accounting.ts:5-7]:

```typescript
const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Некорректный месяц (YYYY-MM)')
```

Extend:

```typescript
export const createTuitionPaymentSchema = z.object({
  studentId: z.string().min(1),
  date: dateSchema,
  month: monthSchema,
  amountKopecks: positiveKopecksSchema,
  method: paymentMethodSchema,
  comment: z.string().trim().optional(),
})

export const createTuitionPaymentsBatchSchema = z.object({
  date: dateSchema,
  month: monthSchema,
  method: paymentMethodSchema,
  comment: z.string().trim().optional(),
  items: z.array(/* ... */).min(1).max(100),
})

export const createTuitionPaymentRequestSchema = z.object({
  month: monthSchema,
  lines: z.array(/* ... */).min(1).max(20),
})
```

### Pure unpaid detector (recommended)

```typescript
export function isMonthUnpaid(input: {
  chargeKopecks: number // charge amount or tariff fallback
  paidKopecks: number   // sum payments where payment.month === month
}): boolean {
  return input.chargeKopecks > 0 && input.paidKopecks < input.chargeKopecks
}
```

Partial ⇒ unpaid (D-06). Aggregate across selected children for parent indicator: unpaid if **any** selected child unpaid for that month, or if combined paid &lt; combined charges — **recommend per-child OR**: month is yellow if any selected child fails coverage (clearer for multi-child). Document choice in PLAN; default **any child unpaid ⇒ yellow**.

### Confirm copies month

```typescript
const payment = await tx.tuitionPayment.create({
  data: {
    studentId: line.studentId,
    date,
    month: request.month,
    amount: line.amount,
    method: parsed.data.method,
    comment,
    createdById: session.user.id,
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| monthPaid via payment.date ∈ month range | Explicit `payment.month` | Phase 17 | Attribution independent of cash day |
| Parent request without month | Request.month single field | Phase 17 | TUITION-01 |
| Cashier sees only payments + requests | + debts-by-month page | Phase 17 | TUITION-04 |
| CASHIER role dual cash routes | Extend with debts prefix | After Phase 16 | Menu + ROLE_ROUTES |

**Deprecated/outdated:**
- Filtering tuition payments by `monthKeyToDateRange` for “оплачено за месяц” status — replace in Phase 17.

## Discretion Recommendations (for planner)

| Topic | Recommendation | Rationale |
|-------|----------------|-----------|
| Debts path | `/accounting/debts` | Short; parallel to `/payments`; Russian menu «Долги» |
| Debts layout | Ant Design `Table` with columns: Ученик, Опекун, Месяц, Начислено, Оплачено, Долг; optional group filter + search like payments | Matches StudentPaymentsPage density; D-08 |
| Yellow indicator | `Tag color="gold"` text «Не оплачен» in `optionRender` | Locked yellow; theme-safe |
| Parent default month | First unpaid in range, else `currentMonthKey()` | UX for D-04 |
| Direct pay month source | Required field = page `AccountingMonthPicker` month (send in POST); show Tag «За месяц: YYYY-MM» near pay controls | Avoids second picker; satisfies D-10 |
| Request backfill | `createdAt` Moscow month | D-03 names payments; requests need deterministic NOT NULL |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Parent unpaid yellow uses OR across selected children (any unpaid child ⇒ yellow) | Code Examples / Discretion | Slightly different UX if user expected combined-sum rule — confirm in plan if needed |
| A2 | SQL backfill `AT TIME ZONE 'Europe/Moscow'` matches app intent better than UTC slice of noon-Z dates | Migration pattern | Rare edge near TZ boundaries; payments use `toSessionDate` noon UTC so UTC `YYYY-MM` usually matches |
| A3 | No Prisma “TS Migration class” adoption this phase | Standard Stack | Low — repo already uses SQL migrations |

**If A1 needs lock:** planner can add a one-line decision in PLAN.md Wave 0.

## Open Questions (RESOLVED)

1. **Unpaid aggregation across multiple children** (RESOLVED)
   - What we know: D-06 says payments for selected children vs charge; partial unpaid.
   - Decision: any-child unpaid ⇒ yellow (OR / A1). Locked in 17-02-PLAN and CONTEXT discretion.
   - RESOLVED: 2026-11-05 via plan-check fix + 17-02.

2. **E2E Node version on research machine** (RESOLVED)
   - What we know: Phase 16 verification flagged Playwright failure on Node v22.15 (`context.conditions`). [VERIFIED: .planning/phases/16-cashier-role-access/16-VERIFICATION.md:13-18]
   - Decision: author E2E specs this phase (17-04); run gate on Node ≥22.22 where possible; document Node caveat in SUMMARY if local gate blocked.
   - RESOLVED: 2026-11-05 via 17-04-PLAN + plan-check.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | v22.15.0 (local probe) | Prefer ≥22.22 for Playwright per Phase 16 note |
| pnpm | scripts | ✓ | 9.15.9 | — |
| PostgreSQL | migrate | ✓ (project standard / Docker) | via DATABASE_URL | — |
| Vitest | unit | ✓ | ^4.1.9 | — |
| Playwright | e2e | ✓ installed | ^1.61.0 | Manual UAT if Node &lt;22.22 blocks |
| New npm packages | — | N/A | — | — |

**Missing dependencies with no fallback:** none for planning  
**Missing dependencies with fallback:** Playwright may need newer Node — fallback human UAT (same as Phase 16)

Step 2.6 note: phase is code + DB migrate; no new external SaaS.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.9 + Playwright ^1.61.0 |
| Config file | vitest via `pnpm test:unit`; Playwright project config in repo |
| Quick run command | `pnpm test:unit src/shared/lib/validations/tuition-payment-request.test.ts src/features/parent-portal/lib/unpaid-months.test.ts src/shared/lib/match-role-route.test.ts src/features/accounting/lib/accounting-rules.test.ts` |
| Full suite command | `pnpm test:unit && pnpm test:e2e e2e/tuition-month.spec.ts e2e/cashier-role.spec.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUITION-01 | Request schema requires `month`; create persists one month for all lines | unit + e2e | Vitest schema; E2E parent submit | ⚠️ extend `tuition-payment-request.test.ts` |
| TUITION-02 | Unpaid months marked yellow in select | unit + e2e | unpaid helper unit; E2E option Tag visible | ❌ Wave 0 `unpaid-months.test.ts` + e2e |
| TUITION-03 | Accountant opens debts page, sees month debt rows | e2e | `e2e/tuition-month.spec.ts` | ❌ Wave 0 |
| TUITION-04 | Cashier opens debts + sees request month | e2e + unit routes | E2E + `match-role-route` debts cases | ❌ Wave 0 extend route tests |
| D-02 attribution | monthPaid uses `payment.month` not date | unit | New test: date in Nov, month=`2026-09` counts for Sep | ❌ Wave 0 |
| D-10 | POST payment without month rejected | unit | Zod safeParse false | ❌ Wave 0 |
| TEST-04 | Cashier matrix + create/confirm still work with month | e2e regression | `e2e/cashier-role.spec.ts` + tuition-month confirm flow | ✅ cashier; extend tuition |

### Sampling Rate
- **Per task commit:** targeted Vitest files above  
- **Per wave merge:** `pnpm test:unit`  
- **Phase gate:** unit green + `e2e/tuition-month.spec.ts` + `e2e/cashier-role.spec.ts`

### Wave 0 Gaps
- [ ] `src/features/parent-portal/lib/unpaid-months.ts` + `.test.ts` — unpaid detection + month range (REQ TUITION-02, D-05/D-06)
- [ ] Extend `tuition-payment-request.test.ts` — `month` required / invalid format
- [ ] Extend `match-role-route.test.ts` — `/accounting/debts` CASHIER+ACCOUNTANT allow; TEACHER deny
- [ ] Unit for monthPaid attribution (payment.month vs date) — new test file or `accounting-rules.test.ts`
- [ ] `e2e/tuition-month.spec.ts` — parent yellow indicator; accountant+cashier debts page; payment create with month; confirm shows/copies month
- [ ] Update existing schema tests that omit `month` once Zod changes (TEST-04)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth session via `requireRole` / `authorizeApiRequest` |
| V3 Session Management | no change | Existing JWT sessions |
| V4 Access Control | yes | `ROLE_ROUTES` + `requireRoles(['ACCOUNTANT','CASHIER'])`; parent only own children |
| V5 Input Validation | yes | Zod `monthSchema` + positive amounts |
| V6 Cryptography | no | — |

### Known Threat Patterns for tuition/accounting

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Parent pays for other students | Elevation | Existing parentId ownership check on submit |
| Cashier accesses full accounting | Elevation | Longest-prefix ROLE_ROUTES; debts explicit allow only |
| Inject invalid month / SQL | Tampering | Zod regex; Prisma parameterized |
| Mass-assign month via client | Tampering | Server trusts Zod body; confirm uses **request.month** from DB not client override |
| IDOR on debts page | Information disclosure | Roles only; no parent IDs in URL needed for list; keep read-only for cashier |

`security_enforcement`: enabled (config default).

## Sources

### Primary (HIGH confidence)
- In-repo reads: `17-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md` Phase 17, `prisma/schema.prisma`, parent-portal + accounting actions/UI, `query-student-payments.ts`, `validations/accounting.ts`, `match-role-route.ts`, Phase 16 CONTEXT/VERIFICATION, `.cursor/rules/prisma-migrations.mdc`, `new-module-tests.mdc`
- Subject migration SQL pattern: `prisma/migrations/20260707180000_add_subject/migration.sql`

### Secondary (MEDIUM confidence)
- Context7 `/websites/prisma_io` — expand migration addColumn → backfill → setNotNull
- Context7 `/ant-design/ant-design/6.5.0` — Select `optionRender` / `labelRender`

### Tertiary (LOW confidence)
- research-plan seam input failed to parse on Windows temp path this session — docs fetched via Context7 directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse existing packages; no installs
- Architecture: HIGH — seams and locked decisions verified in code
- Pitfalls: HIGH — date-vs-month and ROLE_ROUTES pitfalls observed in current source

**Research date:** 2026-11-05  
**Valid until:** 2026-12-05 (stable brownfield; revisit if Prisma migrator style changes)

## RESEARCH COMPLETE
