---
phase: 11-groups-enrollment
plan: 05
subsystem: database
tags: [prisma, seed, GroupEnrollment, subjectId]

requires:
  - phase: 11-groups-enrollment
    provides: Group.subjectId + GroupEnrollment model (plan 11-01)
provides:
  - Demo seed with subjectId groups and GroupEnrollment junction
  - E2E seed fixtures via GroupEnrollment
affects: [e2e, local-dev]

tech-stack:
  added: []
  patterns:
    - "Seed wipe: groupEnrollment.deleteMany before student.deleteMany"
    - "Student create without groupId/levelId; enrollment in separate create"

key-files:
  created: []
  modified:
    - prisma/seed.ts
    - prisma/seed-e2e.ts

key-decisions:
  - "D-10 demo: student 300001 enrolled in both Quran groups with level 3 (group1) and level 2 (group2)"
  - "E2E wipe extended with extraAssignment chain after demo seed left FK references"

patterns-established:
  - "Seed scripts mirror migration: GroupEnrollment replaces Student.groupId/levelId"

requirements-completed: [SUBJ-05, SUBJ-06]

coverage:
  - id: D1
    description: "prisma/seed.ts creates groups with subjectId and GroupEnrollment instead of Student.groupId"
    requirement: SUBJ-05
    verification:
      - kind: other
        ref: "pnpm db:seed"
        status: pass
    human_judgment: false
  - id: D2
    description: "prisma/seed-e2e.ts uses GroupEnrollment for E2E student fixtures"
    requirement: SUBJ-06
    verification:
      - kind: other
        ref: "pnpm db:seed:e2e"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-07
status: complete
---

# Phase 11 Plan 05: Seed Migration Summary

**Seed-скрипты переведены на Group.subjectId и GroupEnrollment; demo и E2E сиды проходят без ошибок**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-07T20:11:00Z
- **Completed:** 2026-07-07T20:23:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `prisma/seed.ts`: группы с `subjectId` (Коран), зачисления через `GroupEnrollment`, wipe-порядок с `groupEnrollment` перед `student`
- `prisma/seed-e2e.ts`: E2E-фикстуры через `GroupEnrollment`, группы с `subjectId`, совместимость TEST_CODES сохранена
- Демо D-10: ученик 300001 зачислен в обе группы Корана с разными уровнями (3 и 2)

## Task Commits

1. **Task 1: Обновить prisma/seed.ts** - `cd117c2` (feat)
2. **Task 2: Обновить prisma/seed-e2e.ts** - `28870d8` (feat)

## Files Created/Modified

- `prisma/seed.ts` — subjectId на группах, GroupEnrollment вместо groupId/levelId на Student, dual-enrollment demo
- `prisma/seed-e2e.ts` — E2E enrollments, расширенный wipe для extraAssignment

## Decisions Made

- D-10: выбран ученик Али (300001) для демонстрации двойного зачисления в группы одного предмета
- E2E wipe дополнен удалением extraAssignment* — необходимо при запуске после demo seed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] E2E wipe missing extraAssignment cleanup**
- **Found during:** Task 2 (pnpm db:seed:e2e after demo seed)
- **Issue:** FK violation `ExtraAssignment_authorId_fkey` при deleteMany User — demo seed создаёт extra assignments, e2e seed их не удалял
- **Fix:** Добавлены `extraAssignmentCompletion`, `studentExtraAssignment`, `extraAssignment` deleteMany в wipe chain seed-e2e.ts
- **Files modified:** prisma/seed-e2e.ts
- **Verification:** `pnpm db:seed:e2e` exit 0
- **Committed in:** 28870d8

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Минимальное расширение wipe chain — без него E2E seed неработоспособен после demo seed.

## Issues Encountered

None beyond the auto-fixed FK wipe order.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Локальная и E2E среда отражают модель GroupEnrollment
- E2E global-setup может вызывать `pnpm db:seed:e2e` без ошибок

## Self-Check: PASSED

- FOUND: prisma/seed.ts
- FOUND: prisma/seed-e2e.ts
- FOUND: cd117c2
- FOUND: 28870d8

---
*Phase: 11-groups-enrollment*
*Completed: 2026-07-07*
