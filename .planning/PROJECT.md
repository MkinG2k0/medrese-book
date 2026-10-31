# Электронный дневник медресе

## What This Is

Веб-приложение для медресе: ведение журнала посещаемости и успеваемости учеников по учебным предметам. Учителя проводят уроки и выставляют оценки, менеджеры управляют предметами, программами и персоналом, ученики видят прогресс по каждому предмету.

**Shipped v2.0 (2026-07-11):** мультипредметная модель — программа как шаблон на предмет, группа привязана к одному предмету, ученик может учиться в нескольких группах с независимым прогрессом per enrollment.

## Core Value

Учитель и менеджер видят реальный прогресс каждого ученика — что пройдено, сколько времени заняло обучение, где отстаёт — и могут вовремя вмешаться (допзадания, смена преподавателя, контроль нормативов).

## Current Milestone: v3.0 Касса и долги по месяцам

**Goal:** Разделить кассу и бухгалтерию: кассир подтверждает только наличные, оплаты и долги ведутся по месяцам, колонка «Сальдо» убрана из UI.

**Target features:**
- Роль Кассир (только подтверждение наличных); бухгалтер — полный доступ
- Заявка опекуна с одним месяцем на всю заявку; в селекте видны неоплаченные месяцы
- Долг по месяцам виден бухгалтеру и кассиру
- Убрать колонку «Сальдо» из таблицы платежей и Excel

**Waves beyond v3.0 (backlog):**
- v3.1 — формула ЗП (коэф., пунктуальность, аттестация, выходные) + **все параметры/надбавки из UI**, «Я пришёл/Завершить день», окна учителей
- v3.2 — глобальные каникулы (отключение окон/прогулов/штрафов)
- v3.3 — роль Партнёр (donation + итог), переписки менеджеров

## Current State (v2.0 shipped + accounting brownfield)

- **Предметы / группы / прогресс / журнал / аналитика / портал ученика** — v2.0
- **Бухгалтерия (quick):** tuition charges/payments, заявки опекуна, salary accrual по часам×ставке, donations, ledger, month-close
- **Роли:** SUPER_ADMIN, MANAGER, TEACHER, STUDENT, ACCOUNTANT (+ PARENT через quick); CASHIER/PARTNER — нет

## Requirements

### Validated

- ✓ Вход по 6-значному коду (NextAuth v5) — existing
- ✓ Роли SUPER_ADMIN, MANAGER, TEACHER, STUDENT с разграничением маршрутов — existing
- ✓ Журнал учителя: посещаемость, оценки по шагам программы, сохранение сессий — existing
- ✓ Админка: пользователи, группы, награды — existing
- ✓ Базовая аналитика по месяцу — existing
- ✓ E2E-тесты Playwright — existing
- ✓ FSD-архитектура Next.js 16 + Prisma 7 + PostgreSQL — existing
- ✓ SUBJ-01…SUBJ-18: мультипредметная модель — v2.0
- ✓ Портал ученика: дашборд per enrollment, groupId-навигация, история допзаданий — v2.0 Phase 15
- ✓ Допзадания subject-scoped: справочник, назначение на уроке, история по предмету — v2.0 Phase 15
- ✓ Базовая бухгалтерия tuition/salary/donations (quick tasks) — existing brownfield

### Active (v3.0)

См. `.planning/REQUIREMENTS.md`:

- CASH-01…03 — роль кассира и границы доступа
- TUITION-01…04 — месяц оплаты/долга для опекуна, бухгалтера, кассира
- PAYUI-01…03 — убрать «Сальдо», сохранить статусы

### Out of Scope

- Мобильное нативное приложение — веб достаточен для медресе
- ML/предиктивная аналитика — малый масштаб
- S3-хранилище — локальные uploads достаточны (S3 quick task — env only)
- Полная переработка дизайна — точечные UI-улучшения
- Миграция старых completions — fresh start в v2.0 выполнен
- Помощник руководителя — под вопросом, отдельное решение
- Отдельная сущность «повышение квалификации» — слито с аттестацией (v3.1)

## Context

**Tech stack:** Next.js 16, React 19, Ant Design, Tailwind, Prisma 7, PostgreSQL (Neon)

**Техдолг:**
- API-авторизация разрозненная (middleware не покрывает все `/api/*`)
- `next-auth@5.0.0-beta.30`, 6-значные коды без rate-limit
- Legacy global currentStepIdx references в read-paths (см. CONCERNS.md)

**Источник требований v3.0:** переписка Камы 31.10.2026 + уточнения (месяц на заявку, кассир=наличные, волны).

## Constraints

- **Tech stack**: сохранить Next.js 16 + Prisma + PostgreSQL + FSD
- **Architecture**: новые фичи в `src/features/`
- **Language**: UI и документация на русском
- **Roles**: расширять существующую модель ролей; супер-админ вне чата
- **Data**: миграции через Prisma; не ломать существующие sessions/completions/tuition history
- **Security**: закрыть известные уязвимости API (CONCERNS.md)
- **Testing (D-M6)**: на весь функционал бухгалтерии 3.x — автотесты в той же фазе; особенно unit на **калькуляцию ЗП** и сценарии **выдачи ЗП** (v3.1)
- **Salary config (D-M7)**: все надбавки, коэффициенты, пороги и дедлайны ЗП меняются из UI; значения из требований — только дефолты

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Программа — шаблон на предмет | Все группы по одному предмету делят одну программу | ✓ v2.0 |
| Fresh start для v2.0 | Новая схема без миграции старых completions | ✓ v2.0 |
| 1 группа = 1 предмет | Ученик в нескольких группах → несколько предметов | ✓ v2.0 |
| Прогресс на GroupEnrollment (D-01) | Независимый прогресс per зачисление | ✓ Phase 12 |
| Subject scope через Step.level.subjectId | Без лишних FK на допзадания | ✓ Phase 15 |
| groupId в URL журнала/портала | Единый контракт навигации | ✓ Phase 13, 15 |
| Чат отложен из v1 | Фокус на обучении | — Pending / v3.3 manager chat |
| Зачёт шагов при создании | syncCompletionsForProgress | ✓ Good |
| v3.0 = только касса+месяцы (D-M5) | Волновый rollout бухгалтерии 3.0 | Active |
| Один месяц на заявку опекуна (D-M1) | Проще UX и учёт | Locked |
| Кассир только наличные (D-M2) | Разделение сбора и полного бухучёта | Locked |
| Тесты на весь 3.x функционал (D-M6) | Регрессии в деньгах недопустимы; ЗП — приоритет | Locked |
| Параметры ЗП из UI (D-M7) | Надбавки/коэф./пороги без деплоя | Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-31 — milestone v3.0 started*
