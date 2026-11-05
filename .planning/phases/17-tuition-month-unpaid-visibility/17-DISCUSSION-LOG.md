# Phase 17: Tuition month & unpaid visibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-05  
**Phase:** 17-tuition-month-unpaid-visibility  
**Areas discussed:** Привязка платежа к месяцу; Селект неоплаченных; Где долг по месяцам; Прямой приём наличных

---

## Привязка платежа к месяцу

| Option | Description | Selected |
|--------|-------------|----------|
| Явный `month` на Request + Payment | Confirm копирует month; monthPaid по `payment.month` | ✓ |
| Только request.month | Payment по-прежнему по date range | |
| Без миграции payment | Считать только через request lines | |

**User's choice:** да (явная привязка платежа к месяцу)  
**Notes:** Рекомендация Claude принята: backfill старых платежей из даты.

---

## Селект неоплаченных у опекуна

| Option | Description | Selected |
|--------|-------------|----------|
| Жёлтый индикатор | Tag/dot warning/gold на неоплаченных option | ✓ |
| Только список неоплаченных | Без оплаченных в селекте | |
| Красный / текст «долг» | Альтернативные маркеры | |

**User's choice:** жёлтым индикатором  
**Notes:** —

---

## Где долг по месяцам у бухгалтера/кассира

| Option | Description | Selected |
|--------|-------------|----------|
| Отдельная страница | Новый accounting route + меню | ✓ |
| Колонка/drawer в Платежах | Без нового route | |
| Только в заявках | month на request list | |

**User's choice:** отдельная страница  
**Notes:** Месяц на списке заявок — дополнительно (D-09), не вместо страницы.

---

## Прямой приём наличных без заявки

| Option | Description | Selected |
|--------|-------------|----------|
| Обязательный month на create payment | CASHIER + ACCOUNTANT | ✓ |
| Month только через заявку опекуна | Прямой платёж без month | |

**User's choice:** да  
**Notes:** —

---

## Claude's Discretion

- Path/label страницы долгов, layout таблицы
- Точный UI жёлтого индикатора в Ant Design Select
- Фильтры на странице долгов (минимум)
- Month в Excel — не в этой фазе

## Deferred Ideas

- Phase 18: Сальдо
- v3.1: ЗП
