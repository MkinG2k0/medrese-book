# Электронный дневник медресе

## What This Is

Веб-приложение для медресе: ведение журнала посещаемости и успеваемости учеников по учебным предметам. Учителя проводят уроки и выставляют оценки, менеджеры управляют предметами, программами и персоналом, ученики видят прогресс по каждому предмету. Бухгалтерия: tuition по месяцам, кассир (наличные), зарплаты (базовый accrual).

**Shipped v2.0 (2026-07-11):** мультипредметная модель — программа как шаблон на предмет, группа привязана к одному предмету, ученик может учиться в нескольких группах с независимым прогрессом per enrollment.

**Shipped v3.0 (2026-11-08):** роль Кассир (только наличные); оплаты и долги по месяцам; колонка «Сальдо» убрана из UI/Excel.

## Core Value

Учитель и менеджер видят реальный прогресс каждого ученика — что пройдено, сколько времени заняло обучение, где отстаёт — и могут вовремя вмешаться (допзадания, смена преподавателя, контроль нормативов).

## Current Milestone

Нет активного milestone. Следующий: **v3.1 ЗП / явка / окна** — через `/gsd-new-milestone`.

**Waves beyond v3.0:**
- v3.1 — формула ЗП (коэф., пунктуальность, аттестация, выходные) + **все параметры/надбавки из UI**, «Я пришёл/Завершить день», окна учителей
- v3.2 — глобальные каникулы
- v3.3 — роль Партнёр (donation + итог), переписки менеджеров

## Current State

- **Предметы / группы / прогресс / журнал / аналитика / портал ученика** — v2.0
- **Бухгалтерия v3.0:** Role.CASHIER; `month` на TuitionPaymentRequest/Payment; `/accounting/debts`; unpaid gold Select у опекуна; без колонки «Сальдо»
- **Роли:** SUPER_ADMIN, MANAGER, TEACHER, STUDENT, PARENT, ACCOUNTANT, CASHIER

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
- ✓ Допзадания subject-scoped — v2.0 Phase 15
- ✓ Базовая бухгалтерия tuition/salary/donations (quick) — brownfield
- ✓ CASH-01…03 — роль кассира и границы доступа — v3.0
- ✓ TUITION-01…04 — месяц оплаты/долга — v3.0
- ✓ PAYUI-01…03 — убрать «Сальдо», сохранить статусы — v3.0
- ✓ TEST-01 / TEST-04 для v3.0 — v3.0

### Active

(пусто — определить в `/gsd-new-milestone` для v3.1)

Ожидаемые кандидаты v3.1: SAL-*, SAL-CFG-*, ATTEND-01, WINDOW-01, TEST-02, TEST-03.

### Out of Scope

- Мобильное нативное приложение — веб достаточен для медресе
- ML/предиктивная аналитика — малый масштаб
- S3-хранилище — локальные uploads достаточны
- Полная переработка дизайна — точечные UI-улучшения
- Помощник руководителя — под вопросом, отдельное решение
- Отдельная сущность «повышение квалификации» — слито с аттестацией (v3.1)

## Context

**Tech stack:** Next.js 16, React 19, Ant Design, Tailwind, Prisma 7, PostgreSQL (Neon)

**v3.0 ship note:** audit 2026-11-08 — unit 60 + E2E 18 green (Node 22.22). Deploy: `pnpm db:migrate:deploy` for CASHIER + tuition month columns if not yet on prod.

**Техдолг:**
- API-авторизация разрозненная (middleware не покрывает все `/api/*`)
- `next-auth@5.0.0-beta.30`, 6-значные коды без rate-limit
- Legacy quick_tasks без SUMMARY (см. STATE.md Deferred Items)

## Constraints

- **Tech stack**: сохранить Next.js 16 + Prisma + PostgreSQL + FSD
- **Architecture**: новые фичи в `src/features/`, server actions / API routes
- **Language**: UI и документация на русском
- **Data**: не ломать сессии и completions; миграции через Prisma
- **Security**: известные уязвимости API — в рамках фаз безопасности

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Программа — шаблон на предмет | Группы делят программу предмета | ✓ v2.0 |
| Прогресс на GroupEnrollment (D-01) | Независимый прогресс per зачисление | ✓ v2.0 |
| groupId в URL журнала/портала | Единый контракт навигации | ✓ v2.0 |
| D-M1 Один месяц на всю заявку опекуна | Простота UX и учёта | ✓ v3.0 |
| D-M2 Кассир только наличные; бухгалтер — всё | Разделение кассы | ✓ v3.0 |
| D-M5 Delivery волнами v3.0→v3.3 | Управляемый scope | ✓ Good |
| D-M6 Автотесты в той же фазе | Quality gate 3.x | ✓ v3.0 |
| D-M7 Параметры ЗП из UI | Гибкость | — Pending v3.1 |
| monthPaid по `payment.month` не по date | Оплата «за» месяц | ✓ v3.0 |
| Долги на `/accounting/debts` | TUITION-03/04 UX | ✓ v3.0 |

---
*Last updated: 2026-11-08 after v3.0 milestone*
