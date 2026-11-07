# Phase 17: Tuition month & unpaid visibility - Context

**Gathered:** 2026-11-05  
**Status:** Ready for planning

<domain>
## Phase Boundary

Оплаты и долги привязаны к **месяцу**: заявка опекуна хранит **один** `month` на всю заявку (все дети — тот же месяц); в селекте месяца неоплаченные помечены; бухгалтер и кассир видят долг **по месяцам** на отдельной странице; прямой приём наличных тоже с выбором месяца. Автотесты в той же фазе (TEST-01/04).

Не входит: убрать колонку «Сальдо» (Phase 18), ЗП / UI-параметры ЗП (v3.1), смена ролей кассира (Phase 16 done).

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / requirements
- `.planning/REQUIREMENTS.md` — TUITION-01…04, TEST-01, TEST-04, D-M1, D-M6
- `.planning/ROADMAP.md` — Phase 17 success criteria
- `.planning/PROJECT.md` — Current Milestone v3.0, constraints
- `.planning/HANDOFF.json` — resume after Phase 16
- `.planning/phases/16-cashier-role-access/16-CONTEXT.md` — CASHIER cash desk, menu, no reverse
- `.planning/phases/16-cashier-role-access/16-VERIFICATION.md` — cashier integration points

### Code patterns
- `prisma/schema.prisma` — `TuitionPaymentRequest`, `TuitionPayment`, `TuitionCharge` (charge already has `month`)
- `src/shared/lib/validations/accounting.ts` — `createTuitionPaymentRequestSchema`, payment create schemas, `monthSchema`
- `src/features/parent-portal/ui/ParentPayForm.tsx` — экран оплаты опекуна (сейчас без month)
- `src/features/parent-portal/actions/parent-payment-actions.ts` — submit/list requests
- `src/features/accounting/actions/payment-request-actions.ts` — confirm → create payments
- `src/features/accounting/lib/query-student-payments.ts` — monthPaid сейчас по date range
- `src/features/accounting/lib/compute-student-balance.ts` — статусы долга
- `src/features/accounting/ui/StudentPaymentsPage.tsx` — приём платежей (нужен month picker)
- `src/features/accounting/ui/PaymentRequestsPage.tsx` — список заявок
- `src/shared/lib/accounting/month.ts` — monthKey / date range
- `src/shared/lib/match-role-route.ts` — ROLE_ROUTES (добавить path страницы долгов для CASHIER+ACCOUNTANT)
- `src/widgets/app-shell/ui/AppShell.tsx` — MENU_ORDER_BY_ROLE
- `.cursor/rules/new-module-tests.mdc` — E2E в том же изменении
- `.cursor/rules/prisma-migrations.mdc` — безопасные ADD COLUMN миграции

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `monthSchema` / `AccountingMonthPicker` — month `YYYY-MM` UX уже есть у бухгалтера
- `TuitionCharge.month` — эталон хранения месяца начисления
- `queryStudentPaymentsForMonth` + `resolveStudentPaymentStatus` — переключить monthPaid на `payment.month`
- Phase 16: `CASH_DESK_ROLES`, `assertCashierCashMethod`, ROLE_ROUTES dual prefixes

### Established Patterns
- Parent portal: server actions + client form (`ParentPayForm`)
- Accounting pages: RSC `requireRoles` + client table pages
- API payments POST: Zod + `authorizeApiRequest`
- Migrations: ADD COLUMN + backfill SQL; no DROP on prod data

### Integration Points
- Prisma: add `month` to Request + Payment; migrate + generate
- Confirm request: copy `request.month` → each `TuitionPayment.month`
- Parent submit schema: require `month`
- Payments create/batch API + StudentPaymentsPage: require `month`
- New debts page: route, menu for ACCOUNTANT+CASHIER, query unpaid-by-month
- ROLE_ROUTES + AppShell for cashier access to debts page
- E2E: parent pay + debts visibility + cashier/accountant

</code_context>

<specifics>
## Specific Ideas

- Неоплаченные в селекте — **жёлтый индикатор** (не красный, не только текст)
- Долг по месяцам — **отдельная страница**, не встройка только в текущую таблицу платежей
- Прямой CASH/платёж с кассы — **да, с выбором месяца**

</specifics>

<deferred>
## Deferred Ideas

- Убрать колонку «Сальдо» из UI и Excel — Phase 18
- ЗП формула / UI-конфиг параметров — v3.1
- Обязательный month в Excel-экспорте платежей — не в Phase 17,除非 не блокирует
- Партнёр / пожертвования — v3.3

</deferred>

---

*Phase: 17-tuition-month-unpaid-visibility*  
*Context gathered: 2026-11-05*
