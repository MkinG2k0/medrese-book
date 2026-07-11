# Phase 12: Progress & Sessions - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза 12 доставляет **прогресс и сессии в скоупе группы (зачисления)**:

- `GroupEnrollment.currentStepIdx` + `levelId` — прогресс ученика **в конкретной группе**
- `Session` привязана к ученику, дате и **groupId**; посещаемость и оценки — в рамках занятия в этой группе
- `recalculate-step-progress`, prior credit (`syncCompletionsForProgress`) и auto-promote работают **per enrollment**, не глобально
- Удаление глобального `Student.currentStepIdx`; API и server actions возвращают прогресс с контекстом группы/enrollment

**⚠️ Отклонение от ROADMAP/SUBJ-08:** пользователь явно выбрал **прогресс на группу**, а не «независимый прогресс на каждый предмет». Planner MUST обновить формулировки SUBJ-08…10 и success criteria Phase 12 в ROADMAP/REQUIREMENTS или зафиксировать intentional deviation с обоснованием (D-10: ученик может быть в двух группах одного предмета с разным прогрессом).

**Вне скоупа фазы 12:** UI журнала с выбором группы и уроком по предмету (Phase 13), аналитика по предмету (Phase 14), портал ученика (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Модель прогресса (скоуп = группа)
- **D-01:** Прогресс хранится **на группу (GroupEnrollment)**, не на предмет и не на `StudentSubjectProgress`. Ученик в двух группах одного предмета имеет **два независимых прогресса**.
- **D-02:** Добавить `currentStepIdx Int` на `GroupEnrollment`. `levelId` уже на junction — оба поля составляют прогресс зачисления.
- **D-03:** Удалить `Student.currentStepIdx` — единственный источник прогресса: поля на `GroupEnrollment`.

### Сессии
- **D-04:** Сессия уникальна по **studentId + date + groupId** (не subjectId). Добавить `groupId` на `Session` с FK → `Group`.
- **D-05:** Посещаемость и step completions урока относятся к сессии конкретной группы.

### Миграция данных
- **D-06:** При миграции: существующий глобальный `Student.currentStepIdx` переносится **только в primary enrollment** (первая по `enrolledAt asc`, как `findPrimaryEnrollment`).
- **D-07:** Остальным enrollments того же ученика при миграции: `currentStepIdx = offset уровня enrollment` (начало уровня), без копирования глобального idx.

### Auto-promote и пересчёт
- **D-08:** Auto-promote при прохождении всех шагов уровня обновляет **только текущее enrollment** (`levelId` + `currentStepIdx`), не синхronizирует другие группы/предметы.

### Claude's Discretion
- Точная сигнатура `recalculateStudentStepIdx` — принимать `enrollmentId` или `(studentId, groupId)` вместо «primary enrollment only».
- Prior credit / adjustment sessions: scope по `groupId` (отдельная adjustment-сессия per group per day или per enrollment context).
- Backfill существующих `Session` без `groupId`: привязать к primary enrollment группы ученика (или группе учителя из journal context) — prod-safe SQL в миграции.
- `syncCompletionsForProgress`: фильтровать completions/steps по subject группы и enrollment level; adjustment session с `groupId`.
- Минимальные адаптации API (`/api/sessions`, `/api/students`, student-admin progress edit) для передачи `groupId` / `enrollmentId` — без полного UI журнала (Phase 13).
- Обновление REQUIREMENTS.md SUBJ-08…10 и ROADMAP Phase 12 success criteria под D-01 (planner task).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & requirements (обновить под D-01)
- `.planning/PROJECT.md` — milestone v2.0; Key Decision «Прогресс по предмету» **superseded** решением D-01 (прогресс на группу)
- `.planning/REQUIREMENTS.md` — SUBJ-08, SUBJ-09, SUBJ-10 (требуют переформулировки)
- `.planning/ROADMAP.md` — Phase 12 goal and success criteria (требуют переформулировки)
- `.planning/phases/11-groups-enrollment/11-CONTEXT.md` — D-10/D-11 (несколько групп одного предмета, levelId на enrollment)

### Schema & migrations
- `prisma/schema.prisma` — `GroupEnrollment`, `Session`, `StepCompletion`, `Student.currentStepIdx` (удалить)
- `prisma/lib/subject-constants.ts` — `DEFAULT_QURAN_SUBJECT_ID` для backfill сессий/групп
- `.cursor/rules/prisma-migrations.mdc` — prod-safe миграции

### Progress & enrollment logic
- `src/shared/lib/student-progress/recalculate.ts` — сейчас primary enrollment + global idx
- `src/shared/lib/student-progress/sync-for-progress.ts` — prior credit, adjustment session
- `src/shared/lib/student-progress/offsets.ts` — subject-scoped offsets (использовать `group.subjectId`)
- `src/shared/lib/enrollment.ts` — `findPrimaryEnrollment`, `findEnrollmentInGroup`

### Sessions API & journal data layer
- `src/app/api/sessions/route.ts` — POST/GET без groupId (расширить)
- `src/features/journal/actions/journal-actions.ts` — `getStudentLesson`
- `src/features/student-admin/actions/student-admin-actions.ts` — progress edit via primary enrollment

### Phase 11 outcomes
- `.planning/phases/11-groups-enrollment/11-06-SUMMARY.md` — tech debt: global currentStepIdx до Phase 12
- `.planning/phases/11-groups-enrollment/11-04-SUMMARY.md` — interim primary enrollment pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`student-progress/` module** — `recalculate`, `syncCompletionsForProgress`, subject-scoped `offsets.ts` (передавать `group.subjectId`).
- **`enrollment.ts`** — `findEnrollmentInGroup(studentId, groupId)` для journal/API после добавления groupId.
- **`GroupEnrollment`** — уже есть `levelId`; добавить `currentStepIdx`.

### Established Patterns
- Primary enrollment = `orderBy enrolledAt asc` (Phase 11 interim) — используется только для **миграции** (D-06), не для runtime recalculate.
- Step offsets per subject via `getStepOffsetForLevel(levelNumber, subjectId)`.
- Server actions + Zod + Prisma transactions для session save + recalculate.

### Integration Points
- **Prisma migration:** `GroupEnrollment.currentStepIdx`, `Session.groupId`, drop `Student.currentStepIdx`, backfill, unique constraint on Session.
- **`recalculateStudentStepIdx`** — вызывается из POST `/api/sessions`; must accept enrollment/group context.
- **student-admin** — progress edit must target specific enrollment (not global student).
- **Journal (Phase 13)** — будет передавать `groupId` из выбранной группы; Phase 12 готовит data model и API contracts.

</code_context>

<specifics>
## Specific Ideas

- Пользователь настаивает: **«прогресс на группу, не на предмет»** — зафиксировать как главное решение фазы.
- Отклонена модель `StudentSubjectProgress` и прогресс per subject из ROADMAP.
- При двух группах одного предмета — два независимых прогресса (согласуется с Phase 11 D-10/D-11).

</specifics>

<deferred>
## Deferred Ideas

- **StudentSubjectProgress** (прогресс на предмет) — отклонено пользователем
- **Session unique by subjectId** (SUBJ-09 как в ROADMAP) — заменено на student + date + groupId (D-04)
- **UI журнала / subject-picker** — Phase 13
- **Синхронизация прогресса между группами одного предмета** — отклонено (D-08: enrollment-only promote)
- Области не обсуждавшиеся в этой сессии: детальный prior credit UX, полный backfill policy для legacy sessions — на planner/executor (Claude's Discretion)

</deferred>

---

*Phase: 12-Progress & Sessions*
*Context gathered: 2026-07-11*
