# Электронный дневник медресе

## What This Is

Веб-приложение для медресе: ведение журнала посещаемости и успеваемости учеников по учебным предметам. Учителя проводят уроки и выставляют оценки, менеджеры управляют предметами, программами и персоналом, ученики видят прогресс по каждому предмету.

**Shipped v2.0 (2026-07-11):** мультипредметная модель — программа как шаблон на предмет, группа привязана к одному предмету, ученик может учиться в нескольких группах с независимым прогрессом per enrollment.

## Core Value

Учитель и менеджер видят реальный прогресс каждого ученика — что пройдено, сколько времени заняло обучение, где отстаёт — и могут вовремя вмешаться (допзадания, смена преподавателя, контроль нормативов).

## Current State (v2.0 shipped)

- **Предметы:** CRUD, программа (уровни → шаги) per subject, Tiptap-редактор
- **Группы:** 1 группа = 1 предмет; many-to-many зачисление учеников
- **Прогресс:** GroupEnrollment.currentStepIdx; recalculate/sync per groupId
- **Сессии:** уникальность student + date + groupId
- **Журнал:** выбор группы → прогресс и урок по предмету группы
- **Аналитика:** селект предмета, метрики в subject scope
- **Портал ученика:** дашборд per enrollment, groupId-навигация, история допзаданий по предметам
- **Seed:** три демо-предмета (Коран, Таджвид, Арабский язык)

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

### Active (next milestone — TBD via `/gsd-new-milestone`)

Кандидаты из v1.0 backlog (не вошли в v2.0):

- Карточка ученика (STUD-02, STUD-03)
- Статусы ученика расширенные (STUD-06, STUD-07) — частично через quick task
- Безопасность: idle timeout, login/logout audit (SECU-01, SECU-02)
- Централизованный student-progress module (FND-03)
- dispatchDomainEvent fan-out (FND-04)
- Аудит действий (AUDT-01…04) — частично через quick task
- Аналитика преподавателя (TANL-01…04)
- Чат (CHAT-01…03) — частично через quick task messenger

### Out of Scope

- Мобильное нативное приложение — веб достаточен для медресе
- ML/предиктивная аналитика — малый масштаб
- S3-хранилище — локальные uploads достаточны (S3 quick task — env only)
- Полная переработка дизайна — точечные UI-улучшения
- Миграция старых completions — fresh start в v2.0 выполнен

## Context

**Tech stack:** Next.js 16, React 19, Ant Design, Tailwind, Prisma 7, PostgreSQL (Neon)

**Техдолг после v2.0:**
- API-авторизация разрозненная (middleware не покрывает все `/api/*`)
- `next-auth@5.0.0-beta.30`, 6-значные коды без rate-limit
- Legacy global currentStepIdx references в read-paths (см. CONCERNS.md)

**Бэклог:** утверждён 2026-06-24; v2.0 закрыл SUBJ-01…18.

## Constraints

- **Tech stack**: сохранить Next.js 16 + Prisma + PostgreSQL + FSD
- **Architecture**: новые фичи в `src/features/`
- **Language**: UI и документация на русском
- **Roles**: существующая модель ролей; супер-админ вне чата
- **Data**: миграции через Prisma; не ломать существующие sessions/completions
- **Security**: закрыть известные уязвимости API (CONCERNS.md)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Программа — шаблон на предмет | Все группы по одному предмету делят одну программу | ✓ v2.0 |
| Fresh start для v2.0 | Новая схема без миграции старых completions | ✓ v2.0 |
| 1 группа = 1 предмет | Ученик в нескольких группах → несколько предметов | ✓ v2.0 |
| Прогресс на GroupEnrollment (D-01) | Независимый прогress per зачисление | ✓ Phase 12 |
| Subject scope через Step.level.subjectId | Без лишних FK на допзадания | ✓ Phase 15 |
| groupId в URL журнала/портала | Единый контракт навигации | ✓ Phase 13, 15 |
| Чат отложен из v1 | Фокус на обучении | — Pending |
| Зачёт шагов при создании | syncCompletionsForProgress | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-12 after v2.0 milestone shipped*
