---
phase: 15-student-portal-extra-assignments
plan: 04
subsystem: api
tags: [nextjs, prisma, extra-assignments, student-portal, playwright, ant-design]

requires:
  - phase: 15-student-portal-extra-assignments
    provides: groupId navigation, subject-scoped catalog (15-02, 15-03)
provides:
  - GET /api/extra-assignments/history для STUDENT с subject в ответе
  - Страница /student/extra-assignments с группировкой по предмету
  - Nav item «Доп. задания» в STUDENT меню
  - E2E seed multi-subject extra assignments + обновлённые spec
affects: []

tech-stack:
  added: []
  patterns:
    - "STUDENT history API: studentId только из session; forbidden() при чужом id"
    - "Subject в history row: session.group.subject ?? displayStep.level.subject"
    - "StudentExtraAssignmentsHistory: Collapse секции per subject.name"

key-files:
  created:
    - src/app/api/extra-assignments/history/route.test.ts
    - src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx
    - src/app/(dashboard)/student/extra-assignments/page.tsx
  modified:
    - src/app/api/extra-assignments/history/route.ts
    - src/shared/lib/validations/extra-assignment.ts
    - src/entities/extra-assignment/model/types.ts
    - src/entities/extra-assignment/api/use-extra-assignments.ts
    - src/widgets/app-shell/ui/AppShell.tsx
    - prisma/seed-e2e.ts
    - e2e/student.spec.ts
    - e2e/extra-assignments.spec.ts

key-decisions:
  - "STUDENT history: один preAuth + scoped authorize с resolved studentId"
  - "subjectId filter через OR session.group / displayStep.level joins"
  - "seed-e2e: второй предмет Таджвид + dual enrollment Али для E2E секций"

patterns-established:
  - "useStudentExtraAssignmentHistory без studentId для STUDENT client"
  - "E2E dashboard: карточки per enrollment, deep link groupId, primary из меню"

requirements-completed: [SUBJ-16, SUBJ-17]

coverage:
  - id: D1
    description: History API — STUDENT role, subjectId filter, subject в ответе
    requirement: SUBJ-17
    verification:
      - kind: unit
        ref: pnpm exec vitest run src/app/api/extra-assignments/history/route.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Страница /student/extra-assignments с группировкой по предмету и nav item
    requirement: SUBJ-16
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: true
    rationale: Визуальная проверка Collapse-секций per subject требует UAT
  - id: D3
    description: E2E portal cards, groupId navigation, subject filter каталога
    requirement: SUBJ-16, SUBJ-17
    verification:
      - kind: e2e
        ref: pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts
        status: unknown
    human_judgment: true
    rationale: Playwright не запускается в текущем окружении (Node 22.15 + playwright.config load error)

duration: 18min
completed: 2026-07-12
status: complete
---

# Phase 15 Plan 04: Student Extra-Assignment History Summary

**История допзаданий ученика на /student/extra-assignments с группировкой по предмету и расширенным history API для роли STUDENT**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-11T23:02:00Z
- **Completed:** 2026-07-11T23:20:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- History API принимает STUDENT без query studentId; чужой studentId → 403; optional subjectId filter
- Response rows содержат `subject: { id, name }` для UI-группировки
- Страница `/student/extra-assignments` с Collapse по предметам и таблицей оценок
- Nav STUDENT: «Доп. задания» после «История занятий»; «Уроки»/«История» сохранены (D-06)
- seed-e2e: предмет Таджвид, dual enrollment Али, допзадания в 2 предметах
- E2E: dashboard cards, deep link groupId, subject Select в каталоге, student history sections

## Task Commits

Each task was committed atomically:

1. **Task 1: History API — STUDENT role и subjectId filter** - `1d862be` (test RED), `f844211` (feat GREEN)
2. **Task 2: Страница /student/extra-assignments с группировкой по предмету** - `44131b7` (feat)
3. **Task 3: E2E — portal cards, groupId, subject filter** - `fdf47cf` (test)

## Files Created/Modified

- `src/app/api/extra-assignments/history/route.ts` — STUDENT auth, subjectId filter, subject в response
- `src/app/api/extra-assignments/history/route.test.ts` — unit tests (5 cases)
- `src/shared/lib/validations/extra-assignment.ts` — extraAssignmentHistoryQuerySchema
- `src/entities/extra-assignment/model/types.ts` — subject в ExtraAssignmentHistoryRow
- `src/entities/extra-assignment/api/use-extra-assignments.ts` — optional studentId для STUDENT
- `src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx` — Collapse UI
- `src/app/(dashboard)/student/extra-assignments/page.tsx` — student page
- `src/widgets/app-shell/ui/AppShell.tsx` — nav item
- `prisma/seed-e2e.ts` — multi-subject seed data
- `e2e/student.spec.ts`, `e2e/extra-assignments.spec.ts` — обновлённые сценарии

## Decisions Made

- STUDENT с чужим studentId возвращает forbidden() до Prisma query (T-15-07)
- subject resolve: primary session.group.subject, fallback displayStep.level.subject
- seed-e2e расширен предметом Таджвид для E2E subject sections (Wave 0 validation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] seed-e2e multi-subject data для E2E Wave 0**
- **Found during:** Task 3
- **Issue:** 15-VALIDATION.md требует StudentExtraAssignment rows для ≥2 subjects; seed-e2e не содержал допзаданий
- **Fix:** Добавлен предмет Таджвид, dual enrollment Али, templates и instances с оценками
- **Files modified:** prisma/seed-e2e.ts
- **Verification:** pnpm db:seed:e2e успешно
- **Committed in:** fdf47cf

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Seed extension необходим для E2E success criteria; без изменения schema.

## Issues Encountered

- Playwright E2E не запускается: `TypeError: context.conditions?.includes is not a function` при загрузке playwright.config.ts (Node v22.15.0). Unit tests и tsc проходят; seed-e2e выполнен успешно.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 15 complete: SUBJ-16 и SUBJ-17 закрыты implementation + unit coverage
- Рекомендуется прогнать E2E локально после fix Playwright/Node compatibility
- ROADMAP success criteria п.3 (история допзаданий grouped by subject) реализован

## Self-Check: PASSED

- FOUND: .planning/phases/15-student-portal-extra-assignments/15-04-SUMMARY.md
- FOUND: commit 1d862be
- FOUND: commit f844211
- FOUND: commit 44131b7
- FOUND: commit fdf47cf

---
*Phase: 15-student-portal-extra-assignments*
*Completed: 2026-07-12*
