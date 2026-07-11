# Phase 15: Student Portal & Extra Assignments - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 15-Student Portal & Extra Assignments
**Areas discussed:** Структура портала, Навигация ученика

---

## Структура портала

| Option | Description | Selected |
|--------|-------------|----------|
| Дашборд с карточками | На «Мой прогресс» сразу все предметы/зачисления плитками | ✓ |
| Селект предмета | Один контекст на экране (как /analytics) | |
| Табы | Вкладка на каждый предмет | |

**User's choice:** Дашборд с карточками

### Содержимое карточки

| Option | Description | Selected |
|--------|-------------|----------|
| Минимум | Предмет, группа, уровень, прогресс-бар | |
| С метриками месяца | + StudentMetricsCards на карточке | ✓ |
| Кликабельная + детали | Краткая сводка + переход | |

**User's choice:** С метриками месяца

### Два зачисления в один предмет

| Option | Description | Selected |
|--------|-------------|----------|
| Одна карточка — primary | Прогресс primary enrollment | |
| Одна карточка — лучший | Максимальный прогресс | |
| Карточка per группа | «Коран — Группа А», «Коран — Группа Б» | ✓ |

**User's choice:** Отдельная карточка на каждое зачисление

### Метрики на дашборде

| Option | Description | Selected |
|--------|-------------|----------|
| Per предмет на карточке | | ✓ |
| Общие сверху + прогресс на карточках | | |
| Без метрик на дашборде | | |

**User's choice:** Метрики месяца per предмет/группу на карточке

---

## Навигация ученика

| Option | Description | Selected |
|--------|-------------|----------|
| Из карточки | Клик → уроки/история с groupId в URL | ✓ |
| Глобальный Select | Select группы на страницах | |
| Оба | Select + deep link из карточки | |

**User's choice:** Переход из карточки с `?groupId=`

### Пункты меню

| Option | Description | Selected |
|--------|-------------|----------|
| Оставить «Уроки» и «История» | Внутри страницы контекст | ✓ |
| Убрать из меню | Только через карточки | |
| Переименовать/сгруппировать | | |

**User's choice:** Оставить пункты меню

### URL pattern

| Option | Description | Selected |
|--------|-------------|----------|
| ?groupId= query + localStorage | Как journal/analytics | ✓ |
| /student/lessons/[groupId] | Path segment | |
| На усмотрение planner | | |

**User's choice:** Query param groupId

### Дефолт без groupId (вход из меню)

| Option | Description | Selected |
|--------|-------------|----------|
| Primary enrollment (enrolledAt asc) | Как сейчас | ✓ |
| Последняя из localStorage | | |
| Select без данных | | |

**User's choice:** Primary enrollment

---

## Areas not discussed (planner discretion)

- Справочник допзаданий — subject filter
- Назначение на уроке — subject scope шаблонов
- История допзаданий для ученика — layout и группировка по предмету

## Deferred Ideas

- Subject-select / tabs layout — rejected
- Single card per subject — rejected
- Remove lessons/history from nav — rejected
