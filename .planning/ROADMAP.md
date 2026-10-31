# Roadmap: Электронный дневник медресе

## Milestones

- ✅ **v2.0 Система предметов** — Phases 10–15 (shipped 2026-07-11)
- 🚧 **v3.0 Касса и долги по месяцам** — Phases 16–18 (active)
- 📋 **v1.0** — Phases 0–9 (partially shipped, pre-subjects era)

## Overview

Brownfield. **v3.0** — первая волна обновления бухгалтерии: роль кассира (только наличные), оплаты/долги по месяцам, убрать колонку «Сальдо».

Последующие волны (не в этом roadmap): v3.1 ЗП+явка+окна, v3.2 каникулы, v3.3 партнёр+менеджер-чат.

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

**Requirements:** CASH-01, CASH-02, CASH-03

**Success criteria:**
1. Можно создать пользователя с ролью Кассир и войти под ним
2. Кассир видит только разрешённые экраны/действия подтверждения наличных; остальные accounting-мутации запрещены (UI + API)
3. Бухгалтер по-прежнему может выполнять все операции бухгалтерии, включая подтверждение наличных
4. Middleware / role routes не пускают кассира на ЗП, расходы, закрытие месяца и т.п.

### Phase 17: Tuition month & unpaid visibility

**Goal:** Оплаты и долги привязаны к месяцу: один месяц на заявку опекуна; неоплаченные месяцы видны в селекте; бухгалтер и кассир видят долг по месяцам.

**Requirements:** TUITION-01, TUITION-02, TUITION-03, TUITION-04

**Success criteria:**
1. Заявка опекуна сохраняет одно поле месяца на всю заявку (все дети — тот же месяц)
2. В селекте месяца на экране оплаты отмечены / выделены неоплаченные месяцы
3. Бухгалтер на платежах/долгах видит, за какой месяц долг
4. Кассир видит неоплаченные месяцы опекуна при работе с наличными

**Depends on:** Phase 16 (кассир как актор для TUITION-04)

### Phase 18: Remove Saldo column

**Goal:** Колонка «Сальдо» убрана из таблицы платежей и Excel; статусы оплаты остаются понятными.

**Requirements:** PAYUI-01, PAYUI-02, PAYUI-03

**Success criteria:**
1. В UI таблицы платежей нет колонки «Сальдо»
2. Excel-экспорт платежей не содержит колонку «Сальдо»
3. Бейджи/статусы (Аванс, Оплачено, Долг и т.п.) по-прежнему отображаются и читаемы без сальдо

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 10–15 | v2.0 | — | Complete | 2026-07-11 |
| 16. Cashier role & access | v3.0 | 0/— | Pending | — |
| 17. Tuition month & unpaid | v3.0 | 0/— | Pending | — |
| 18. Remove Saldo column | v3.0 | 0/— | Pending | — |

---
*Last updated: 2026-10-31 — milestone v3.0 roadmap created*
