# Roadmap: Электронный дневник медресе

## Milestones

- ✅ **v2.0 Система предметов** — Phases 10–15 (shipped 2026-07-11)
- 🚧 **v3.0 Касса и долги по месяцам** — Phases 16–18 (active)
- 📋 **v1.0** — Phases 0–9 (partially shipped, pre-subjects era)

## Overview

Brownfield. **v3.0** — первая волна обновления бухгалтерии: роль кассира (только наличные), оплаты/долги по месяцам, убрать колонку «Сальдо».

Последующие волны (не в этом roadmap): v3.1 ЗП+явка+окна, v3.2 каникулы, v3.3 партнёр+менеджер-чат.

**Quality gate (D-M6):** на весь функционал волн 3.x — автотесты в той же фазе, что и фича. Особенно критичны unit-тесты **калькуляции ЗП** и сценарии **выдачи ЗП** (волна v3.1 / TEST-02, TEST-03). Фаза без тестов по её REQ не считается завершённой.

## Phases

<details>
<summary>✅ v2.0 Система предметов (Phases 10–15) — SHIPPED 2026-07-11</summary>

- [x] Phase 10: Subject Foundation (5/5 plans) — completed 2026-07-07
- [x] Phase 11: Groups & Enrollment (6/6 plans) — completed 2026-07-11
- [x] Phase 12: Progress & Sessions (5/5 plans) — completed 2026-07-11
- [x] Phase 13: Journal (4/4 plans) — completed 2026-07-11
- [x] Phase 14: Analytics (3/3 plans) — completed 2026-07-11
- [x] Phase 15: Student Portal & Extra Assignments (4/4 plans) — completed 2026-07-11

Архив: [`.planning/milestones/v2.0-ROADMAP.md`](./milestones/v2.0-ROADMAP.md), phases → [`milestones/v2.0-phases/`](./milestones/v2.0-phases/)

</details>

### Phase 16: Cashier role & access

**Goal:** В системе есть роль Кассир с доступом только к подтверждению наличных; бухгалтер сохраняет полный доступ.

**Requirements:** CASH-01, CASH-02, CASH-03, TEST-01 (часть), TEST-04

**Success criteria:**

1. Можно создать пользователя с ролью Кассир и войти под ним
2. Кассир видит только разрешённые экраны/действия подтверждения наличных; остальные accounting-мутации запрещены (UI + API)
3. Бухгалтер по-прежнему может выполнять все операции бухгалтерии, включая подтверждение наличных
4. Middleware / role routes не пускают кассира на ЗП, расходы, закрытие месяца и т.п.
5. Есть автотесты на разграничение CASHIER vs ACCOUNTANT (E2E и/или unit route guards)

**Plans:** 3/3 plans executed

Plans:

- [x] 16-01-PLAN.md — Role.CASHIER tracer: enum migration, ROLE_ROUTES, redirect, menu, RSC gates
- [x] 16-02-PLAN.md — Cash-only API/UI + Vitest assertCashierCashMethod/canReverse
- [x] 16-03-PLAN.md — User-admin/seed 400002 + unit matrix + e2e/cashier-role.spec.ts (D-M6)

### Phase 17: Tuition month & unpaid visibility

**Goal:** Оплаты и долги привязаны к месяцу: один месяц на заявку опекуна; неоплаченные месяцы видны в селекте; бухгалтер и кассир видят долг по месяцам.

**Requirements:** TUITION-01, TUITION-02, TUITION-03, TUITION-04, TEST-01 (часть), TEST-04

**Success criteria:**

1. Заявка опекуна сохраняет одно поле месяца на всю заявку (все дети — тот же месяц)
2. В селекте месяца на экране оплаты отмечены / выделены неоплаченные месяцы
3. Бухгалтер на платежах/долгах видит, за какой месяц долг
4. Кассир видит неоплаченные месяцы опекуна при работе с наличными
5. Есть автотесты на месяц заявки, отображение неоплаченных месяцев и видимость долга по ролям

**Depends on:** Phase 16 (кассир как актор для TUITION-04)

**Plans:** 4 plans

Plans:
- [ ] 17-01-PLAN.md — Tracer: month columns + migrate + parent/confirm/create + monthPaid by payment.month
- [ ] 17-02-PLAN.md — Parent unpaid Select with gold Tag (D-04…D-06)
- [ ] 17-03-PLAN.md — /accounting/debts dual-role + payment-requests month column
- [ ] 17-04-PLAN.md — E2E tuition-month + cashier regression + visual UAT

### Phase 18: Remove Saldo column

**Goal:** Колонка «Сальдо» убрана из таблицы платежей и Excel; статусы оплаты остаются понятными.

**Requirements:** PAYUI-01, PAYUI-02, PAYUI-03, TEST-01 (часть), TEST-04

**Success criteria:**

1. В UI таблицы платежей нет колонки «Сальдо»
2. Excel-экспорт платежей не содержит колонку «Сальдо»
3. Бейджи/статусы (Аванс, Оплачено, Долг и т.п.) по-прежнему отображаются и читаемы без сальдо
4. Есть автотесты/проверки: колонка отсутствует в UI и в данных экспорта; статусы на месте

## Future waves (testing + config note)

При планировании **v3.1** обязательно включить в phases:

- UI-настройки всех параметров ЗП / надбавок (SAL-CFG-01, D-M7) — числа из требований только как дефолты
- Unit-покрытие **калькуляции ЗП** (TEST-02) — все слагаемые и границы; параметры из конфига
- Тесты **выдачи ЗП** (TEST-03) — payout flow и дедлайн до 10-го
- E2E явки «Я пришёл / Завершить день» и запрет урока вне интервала

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 10–15 | v2.0 | — | Complete | 2026-07-11 |
| 16. Cashier role & access | v3.0 | 3/3 | Awaiting UAT |  |
| 17. Tuition month & unpaid | v3.0 | 0/— | Pending | — |
| 18. Remove Saldo column | v3.0 | 0/— | Pending | — |

---
*Last updated: 2026-11-05 — Phase 16 verified (implementation PASS, human_needed for E2E/UAT)*
