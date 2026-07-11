# Phase 12: Progress & Sessions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-11
**Phase:** 12-Progress & Sessions
**Areas discussed:** Модель прогресса (скоуп группа vs предмет)

---

## Модель хранения прогресса

| Option | Description | Selected |
|--------|-------------|----------|
| StudentSubjectProgress | Отдельная таблица (studentId + subjectId → currentStepIdx + levelId) | ✓ (initially) |
| Только GroupEnrollment | currentStepIdx на каждое зачисление | ✓ (final) |
| Гибрид | SSP для шага, levelId на enrollment | |
| На усмотрение Claude | | |

**User's choice:** Initially StudentSubjectProgress; **уточнение:** «прогресс сохраняется на группу, а не на предмет» → финально **GroupEnrollment**.

**Notes:** Пользователь не понял вопрос про момент создания SSP; уточнение перевело модель с per-subject на per-group.

---

## Скоуп прогресса: группа vs предмет

| Option | Description | Selected |
|--------|-------------|----------|
| Прогресс на группу | currentStepIdx + levelId на GroupEnrollment; два Корана = два прогресса | ✓ |
| Прогресс на предмет | StudentSubjectProgress; один прогресс на Коран (ROADMAP SUBJ-08) | |
| Смешанно | levelId на enrollment, currentStepIdx на предмет | |
| Объясните подробнее | | |

**User's choice:** Прогресс на группу
**Notes:** Явное отклонение от SUBJ-08 / ROADMAP Phase 12. Зафиксировать в CONTEXT и обновить requirements при планировании.

---

## Текущий уровень (levelId)

| Option | Description | Selected |
|--------|-------------|----------|
| levelId на StudentSubjectProgress | | ✓ (initially, superseded) |
| levelId только на enrollment | | ✓ (final — уже есть на GroupEnrollment) |
| Синхронизация обоих | | |

**User's choice:** levelId на enrollment (уже с Phase 11)

---

## Student.currentStepIdx

| Option | Description | Selected |
|--------|-------------|----------|
| Удалить полностью | Единственный источник — GroupEnrollment.currentStepIdx | ✓ |
| Миграция + удалить | | |
| Оставить deprecated | | |

**User's choice:** Удалить

---

## Поля на GroupEnrollment

| Option | Description | Selected |
|--------|-------------|----------|
| Добавить currentStepIdx на GroupEnrollment | | ✓ |
| Отдельная таблица GroupEnrollmentProgress | | |

**User's choice:** currentStepIdx на GroupEnrollment

---

## Session: уникальность

| Option | Description | Selected |
|--------|-------------|----------|
| student + date + groupId | | ✓ |
| student + date + subjectId (SUBJ-09) | | |

**User's choice:** student + date + groupId

---

## Миграция global currentStepIdx

| Option | Description | Selected |
|--------|-------------|----------|
| Только primary enrollment | Остальным — offset уровня | ✓ |
| Во все enrollments Корана | | |
| Offset для всех | | |

**User's choice:** Primary enrollment only

---

## Auto-promote

| Option | Description | Selected |
|--------|-------------|----------|
| Только текущее enrollment | | ✓ |
| Все enrollments того же предмета | | |
| Без auto-promote | | |

**User's choice:** Только текущее enrollment

---

## Claude's Discretion

- Prior credit / adjustment sessions scoped by groupId
- Backfill legacy Session records
- API signature changes (groupId/enrollmentId)
- Обновление SUBJ-08…10 и ROADMAP под per-group модель

## Deferred Ideas

- StudentSubjectProgress table
- Progress per subject (ROADMAP default)
- Session unique by subjectId
- Sync progress across same-subject enrollments
- UI journal / admin subject-picker (Phase 13)
