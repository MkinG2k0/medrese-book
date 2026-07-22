---
phase: 260722-jxy-1-3-5-3-4-5
plan: 01
subsystem: journal
tags: [grades, zod, prisma-migration, passing-grade, journal, extra-assignments]

requires: []
provides:
  - "Шкала оценок 3/4/5 (Средне/Хорошо/Отлично) в UI, Zod и PASSING_GRADE"
  - "Data migration remap исторических оценок 1→3, 3→4"
affects: [analytics-averages, journal, extra-assignments, student-portal]

tech-stack:
  added: []
  patterns:
    - "Grade literals через z.union([z.literal(3), z.literal(4), z.literal(5)])"
    - "Однопроходный CASE-remap в data migration без цепочки equality UPDATE"

key-files:
  created:
    - prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql
  modified:
    - src/shared/lib/step-completion.ts
    - src/shared/lib/validations/extra-assignment.ts
    - src/shared/lib/validations/session.ts
    - src/shared/lib/validations/step-completion.ts
    - src/features/journal/model/use-lesson-page.ts
    - src/shared/lib/student-progress/recalculate.test.ts
    - src/features/journal/ui/StepCard.tsx
    - src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx
    - src/features/journal/ui/StepHistoryPage.tsx
    - src/features/student-portal/ui/StudentSessionsTable.tsx
    - src/features/student-portal/ui/StudentLessonsList.tsx
    - src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx
    - src/features/analytics/ui/StudentStudyHistoryModal.tsx
    - src/features/audit-log/lib/format-audit-entity.ts

key-decisions:
  - "PASSING_GRADE=3 — минимальная оценка новой шкалы остаётся проходом шага"
  - "Zod сужен до literals 3|4|5 вместо min/max диапазона"
  - "Миграция только data CASE; schema.prisma Int без изменений"
  - "Формулы averaging аналитики не трогались — меняются только входные числа"

patterns-established:
  - "UI: value 3/4/5 при неизменных подписях Средне/Хорошо/Отлично"
  - "DB remap: один UPDATE + CASE WHERE grade IN (1, 3)"

requirements-completed: [QUICK-grade-scale-3-4-5]

coverage:
  - id: D1
    description: "PASSING_GRADE=3; isStepPassed(3) true, ниже порога — false"
    requirement: QUICK-grade-scale-3-4-5
    verification:
      - kind: unit
        ref: "src/shared/lib/student-progress/recalculate.test.ts#считает 3 минимальным проходом"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zod session / step-completion / extra-assignment принимают только 3|4|5"
    requirement: QUICK-grade-scale-3-4-5
    verification:
      - kind: other
        ref: "rg z.literal(3)|4|5 in validations"
        status: pass
    human_judgment: false
  - id: D3
    description: "UI GRADE_OPTIONS и label maps на 3/4/5 с теми же русскими подписями"
    requirement: QUICK-grade-scale-3-4-5
    verification:
      - kind: other
        ref: "rg Средне value: 3 across journal/portal/analytics/audit"
        status: pass
    human_judgment: false
  - id: D4
    description: "Prisma data migration CASE remap StepCompletion + ExtraAssignmentCompletion"
    requirement: QUICK-grade-scale-3-4-5
    verification:
      - kind: other
        ref: "prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql"
        status: pass
    human_judgment: true
    rationale: "Deploy migrate на окружении нужен для совпадения исторических лейблов; SQL проверен статически"

duration: 5min
completed: 2026-07-22
status: complete
---

# Phase 260722-jxy: Grade scale 3/4/5 Summary

**Шкала оценок сменена с 1/3/5 на 3/4/5 при тех же подписях Средне/Хорошо/Отлично; PASSING_GRADE=3; исторические строки перемапливаются CASE-миграцией.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-22T11:25:02Z
- **Completed:** 2026-07-22T11:30:00Z
- **Tasks:** 3/3
- **Files modified:** 15

## Accomplishments

- Контракт: `PASSING_GRADE = 3`, Zod literals `3|4|5`, cast в `use-lesson-page`, зелёный `recalculate.test`
- UI: все `GRADE_OPTIONS` и карты подписей (журнал, допзадания, портал, аналитика, audit) на 3/4/5
- Data migration: однопроходный CASE для `StepCompletion` и `ExtraAssignmentCompletion`

## Task Commits

1. **Task 1 (RED):** `95513aa` — test: failing isStepPassed + fixtures grade 3
2. **Task 1 (GREEN):** `4401b51` — feat: PASSING_GRADE, Zod, cast
3. **Task 2:** `0231c03` — feat: UI options and label maps
4. **Task 3:** `9864065` — feat: Prisma data migration remap

_Docs commit (SUMMARY) — orchestrator Step 8; not committed by executor._

## Files Created/Modified

- `src/shared/lib/step-completion.ts` — PASSING_GRADE=3
- `src/shared/lib/validations/{extra-assignment,session,step-completion}.ts` — grade 3|4|5
- `src/features/journal/model/use-lesson-page.ts` — cast 3|4|5
- `src/shared/lib/student-progress/recalculate.test.ts` — fixtures + isStepPassed assertions
- Journal / extra-assignment / portal / analytics / audit UI label maps
- `prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql` — CASE remap

## Impact

На что повлияет смена шкалы **1/3/5 → 3/4/5**:

| Область | Эффект |
|---------|--------|
| **UI** | Кнопки по-прежнему «Средне / Хорошо / Отлично»; в БД/API уходят **3 / 4 / 5**. Отображение истории через обновлённые карты ключей. |
| **Валидация** | Session completions, PATCH step-completion, grade extra-assignment принимают **только** 3\|4\|5; старый минимум `1` и промежуточные (2) отклоняются. |
| **PASSING_GRADE** | Было `1` → стало `3`. `isStepPassed` / sync прогресса: минимальная оценка шкалы по-прежнему проходит шаг (`grade >= 3`). |
| **Аналитика / средние** | Формулы averaging **не переписывались**. Средние **вырастут**: бывшие «Средне»(1) и «Хорошо»(3) станут 3 и 4. «Отлично»(5) без изменений. |
| **Существующие данные** | После `pnpm db:migrate` / `db:migrate:deploy`: `1→3`, `3→4`, `5→5` в `StepCompletion` и `ExtraAssignmentCompletion`. До migrate старые `1`/`3` в UI покажут сырое число (fallback), не «Средне»/«Хорошо». |

## Decisions Made

- Использован существующий `isStepPassed` (в плане назван `isPassingGrade`) — сигнатура не менялась
- Точечные правки дублированных GRADE maps без общего shared-модуля (по плану)
- Миграция только data; `schema.prisma` без изменений

## Deviations from Plan

None - plan executed exactly as written (имя хелпера в плане `isPassingGrade` соответствует коду `isStepPassed`).

## Issues Encountered

None

## User Setup Required

None - после деплоя кода на окружении выполнить `pnpm db:migrate:deploy`, чтобы исторические оценки совпали с новыми лейблами.

## Next Phase Readiness

- Код готов к использованию со шкалой 3/4/5
- На каждом окружении нужна deploy data migration
- E2E по тексту «Средне» не требуют правок (лейблы те же)

## Self-Check: PASSED

- FOUND: `prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql`
- FOUND: `src/shared/lib/step-completion.ts` (PASSING_GRADE=3)
- FOUND commits: `95513aa`, `4401b51`, `0231c03`, `9864065`
- vitest recalculate.test.ts: 4 passed

---
*Quick task: 260722-jxy*
*Completed: 2026-07-22*
