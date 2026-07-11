---
phase: 15-student-portal-extra-assignments
plan: 03
subsystem: api
tags: [nextjs, prisma, extra-assignments, subject-scope, ant-design]

requires:
  - phase: 10-subject-foundation
    provides: Subject, Level.subjectId, DEFAULT_QURAN_SUBJECT_ID
  - phase: 13-journal
    provides: getStudentLesson с group.subjectId, AssignExtraAssignmentModal на уроке
provides:
  - subjectId filter в GET /api/extra-assignments через Step.level join
  - getProgramStepsForExtraAssignments(subjectId) и getExtraAssignmentSubjects()
  - Subject Select в справочнике допзаданий
  - subjectId prop в AssignExtraAssignmentModal на уроке
affects:
  - 15-04 (история допзаданий для ученика с subject grouping)

tech-stack:
  added: []
  patterns:
    - "Subject scope допзаданий через Step.level.subjectId без миграции schema"
    - "getExtraAssignmentSubjects — role-scoped список предметов (паттерн getAnalyticsSubjects)"

key-files:
  created: []
  modified:
    - src/features/extra-assignments/actions/extra-assignment-actions.ts
    - src/shared/lib/validations/extra-assignment.ts
    - src/app/api/extra-assignments/route.ts
    - src/entities/extra-assignment/api/use-extra-assignments.ts
    - src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx
    - src/app/(dashboard)/extra-assignments/page.tsx
    - src/features/extra-assignments/ui/AssignExtraAssignmentModal.tsx
    - src/features/journal/ui/lesson/LessonStepsSection.tsx
    - src/features/journal/actions/journal-actions.ts

key-decisions:
  - "Subject scope через join Step.level.subjectId — без новой колонки в ExtraAssignment"
  - "При активном subjectId filter шаблоны без stepId скрываются (step: { level: { subjectId } })"
  - "Teacher видит только предметы своих групп в getExtraAssignmentSubjects (T-15-05)"

patterns-established:
  - "Extra assignments catalog: subject Select → refetch programLevels + subjectId в useExtraAssignments"
  - "Lesson assign modal: subjectId из group контекста урока, cross-step внутри предмета сохранён"

requirements-completed: [SUBJ-17]

coverage:
  - id: D1
    description: Data layer — API и server actions фильтруют допзадания по subjectId
    requirement: SUBJ-17
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: false
  - id: D2
    description: Справочник /extra-assignments с Select предмета и subject-scoped level/step filters
    requirement: SUBJ-17
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: true
    rationale: Визуальная проверка смены предмета и обновления фильтров требует ручного UAT
  - id: D3
    description: Модалка назначения на уроке показывает только шаблоны предмета группы
    requirement: SUBJ-17
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: true
    rationale: Проверка изоляции шаблонов между предметами на реальном уроке требует ручного UAT

duration: 15min
completed: 2026-07-12
status: complete
---

# Phase 15 Plan 03: Subject-Scoped Extra Assignments Summary

**Допзадания фильтруются по предмету через Step.level.subjectId — в справочнике и при назначении на уроке**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-11T22:54:00Z
- **Completed:** 2026-07-11T23:10:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- GET `/api/extra-assignments` принимает `subjectId` и фильтрует шаблоны через join `step.level.subjectId`
- `getProgramStepsForExtraAssignments(subjectId)` и `getExtraAssignmentSubjects()` с role-scoped доступом для учителя
- Справочник допзаданий: Select «Предмет», refetch уровней/шагов и списка шаблонов при смене предмета
- Модалка назначения на уроке получает `subjectId` группы; cross-step внутри предмета сохранён

## Task Commits

Each task was committed atomically:

1. **Task 1: getProgramStepsForExtraAssignments и API subjectId filter** - `1c15044` (feat)
2. **Task 2: Subject picker в справочнике допзаданий** - `be86f2c` (feat)
3. **Task 3: Assign modal subject filter на уроке** - `8ec7bc1` (feat)

## Files Created/Modified

- `src/features/extra-assignments/actions/extra-assignment-actions.ts` — subject-scoped loaders и список предметов
- `src/app/api/extra-assignments/route.ts` — subjectId query filter
- `src/shared/lib/validations/extra-assignment.ts` — optional subjectId в schema
- `src/entities/extra-assignment/api/use-extra-assignments.ts` — subjectId в client filters
- `src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx` — subject Select и refetch
- `src/app/(dashboard)/extra-assignments/page.tsx` — SSR subjects + default subject
- `src/features/extra-assignments/ui/AssignExtraAssignmentModal.tsx` — required subjectId prop
- `src/features/journal/actions/journal-actions.ts` — subjectId в getStudentLesson return
- `src/features/journal/ui/lesson/LessonStepsSection.tsx` — проброс subjectId в модалку

## Decisions Made

- Subject scope через существующий join — без Prisma migration
- Teacher в getExtraAssignmentSubjects видит только distinct subjectId своих групп (mitigation T-15-05)
- Дефолтный предмет в каталоге: Quran если в списке, иначе первый доступный

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SUBJ-17 закрыт для справочника и назначения на уроке
- Plan 15-04 может строить subject-grouped history для ученика на том же join-паттерне

## Self-Check: PASSED

- FOUND: .planning/phases/15-student-portal-extra-assignments/15-03-SUMMARY.md
- FOUND: commit 1c15044
- FOUND: commit be86f2c
- FOUND: commit 8ec7bc1

---
*Phase: 15-student-portal-extra-assignments*
*Completed: 2026-07-12*
