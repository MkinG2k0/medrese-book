# Phase 18: Remove Saldo column - Context

**Gathered:** 2026-11-07  
**Status:** Ready for planning

<domain>
## Phase Boundary

Убрать колонку **«Сальдо»** из таблицы платежей учеников и из Excel-экспорта платежей. Статусы оплаты (Аванс / Оплачено / Долг / Частично) остаются. Автотесты в той же фазе (TEST-01/04).

Не входит: дашборд «баланс школы» (`compute-school-balance`), логика `balanceKopecks` для статусов/debtors/suggestions (только скрыть колонку), Phase 17 month/debts, v3.1 ЗП.

</domain>

<decisions>
## Implementation Decisions

### UI (PAYUI-01, PAYUI-03)
- **D-01:** Удалить колонку с `title: 'Сальдо'` / `key: 'balanceKopecks'` из `StudentPaymentsPage` Table columns.
- **D-02:** Колонка «Статус» (`renderStatus`) остаётся без изменений поведения.
- **D-03:** Поле `balanceKopecks` в `StudentPaymentRow` / query **сохранить** (нужно для статуса, фильтра должников, suggestPaymentAmount) — не удалять из API/модели.

### Excel (PAYUI-02)
- **D-04:** В `buildPaymentsWorkbook` убрать колонку header «Сальдо» / key `balance` и поле `balance` из `addRow`. Колонка «Статус» остаётся.

### Тесты (TEST-01/04, D-M6)
- **D-05:** Unit: workbook columns не содержат «Сальдо»; статусы в экспорте есть. E2E или UI assert: на `/accounting/payments` нет columnheader «Сальдо»; статусы видны. Регрессия cashier-role не ломается.

### Claude's Discretion
- Вынести `buildPaymentsWorkbook` тест в рядом лежащий `export-excel.test.ts` если нет существующего
- Не трогать dashboard school balance labeling

</decisions>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` — PAYUI-01…03, TEST-01, TEST-04
- `.planning/ROADMAP.md` — Phase 18 success criteria
- `.planning/phases/17-tuition-month-unpaid-visibility/17-CONTEXT.md` — prior accounting patterns
- `src/features/accounting/ui/StudentPaymentsPage.tsx` — колонка Сальдо
- `src/features/accounting/lib/export-excel.ts` — Excel «Сальдо»
- `src/features/accounting/lib/compute-student-balance.ts` — статусы (не ломать)
- `.cursor/rules/new-module-tests.mdc`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderStatus` / `studentStatusLabel` — оставить
- `buildPaymentsWorkbook` — точечно убрать balance column
- E2E `cashier-role` / payments page patterns

### Integration Points
- StudentPaymentsPage columns array
- export-excel buildPaymentsWorkbook
- Possibly download handler on payments page (no API change expected)

</code_context>

<specifics>
## Specific Ideas

User: «проверь сам если норм все давай дальше» — Phase 17 UAT closed by automation; proceed Phase 18 immediately with REQUIREMENTS as locked scope.

</specifics>

<deferred>
## Deferred Ideas

- v3.1 ЗП
- Переименование/рефактор balanceKopecks внутри статусов — не в scope

</deferred>

---

*Phase: 18-remove-saldo-column*  
*Context gathered: 2026-11-07*
