---
phase: 10-subject-foundation
plan: 03
subsystem: api
tags: [prisma, server-actions, vitest, program-admin, offsets]

requires:
  - phase: 10-01
    provides: Level.subjectId schema and createLevelSchema with subjectId
provides:
  - subject-scoped program-actions with deleteLevel and IDOR guard
  - program-paths URL helpers for subject program routes
  - per-subject step offset cache in offsets.ts
  - unit tests for program-actions and offsets
affects: [10-04, 10-05]

tech-stack:
  added: []
  patterns:
    - "program-paths pure helpers for /admin/subjects/[subjectId]/program URLs"
    - "getLevelSteps findFirst with levelId AND subjectId IDOR guard"
    - "deleteLevel student count guard enables D-02 subject delete flow"

key-files:
  created:
    - src/features/program-admin/lib/program-paths.ts
    - src/shared/lib/subject-constants.ts
    - src/features/program-admin/actions/program-actions.test.ts
    - src/shared/lib/student-progress/offsets.test.ts
  modified:
    - src/features/program-admin/actions/program-actions.ts
    - src/shared/lib/student-progress/offsets.ts
  deleted:
    - src/app/(dashboard)/admin/program/**

key-decisions:
  - "DEFAULT_QURAN_SUBJECT_ID mirrored in src/shared/lib/subject-constants.ts for backward-compatible offsets"
  - "Legacy /admin/program routes removed before signature change (D-06)"
  - "invalidateStepOffsetCache called on all program mutations scoped by subjectId"

patterns-established:
  - "revalidatePath uses program-paths helpers and /admin/subjects, never /admin/program"
  - "deleteLevel throws Russian error when students on level; cascade deletes steps"

requirements-completed: [SUBJ-02, SUBJ-03]

coverage:
  - id: D1
    description: "program-paths helpers and subject-scoped offsets with per-subject cache"
    requirement: SUBJ-03
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
      - kind: unit
        ref: "src/shared/lib/student-progress/offsets.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Subject-scoped getLevels/getLevelSteps/deleteLevel and legacy route removal"
    requirement: SUBJ-02
    verification:
      - kind: unit
        ref: "src/features/program-admin/actions/program-actions.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "No remaining revalidatePath /admin/program in program-actions"
    requirement: SUBJ-02
    verification:
      - kind: other
        ref: "grep /admin/program program-actions.ts — no matches"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-07
status: complete
---

# Phase 10 Plan 03: Subject-Scoped Program Actions Summary

**Server-слой программы с subjectId-скоупом, deleteLevel, per-subject offsets и удалением legacy /admin/program**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-07T18:25:00Z
- **Completed:** 2026-07-07T18:45:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `program-paths.ts` — чистые хелперы URL для subject-scoped программы
- `offsets.ts` — `getLevelStepOffsets(subjectId)`, кэш по предмету, backward-compatible `getStepOffsetForLevel`
- `program-actions.ts` — `getLevels(subjectId)`, IDOR-guard в `getLevelSteps`, `deleteLevel` с guard учеников
- Удалены legacy-маршруты `src/app/(dashboard)/admin/program/**`
- Unit-тесты: 5 program-actions + 3 offsets — все проходят

## Task Commits

1. **Task 1: Program paths helper and subject-scoped offsets** - `c47682f` (feat)
2. **Task 2: Remove legacy routes and refactor program actions** - `e18e562` (feat)
3. **Task 3: Offsets unit tests** - `c93d3a7` (test)

## Files Created/Modified

- `src/features/program-admin/lib/program-paths.ts` — URL-хелперы programListPath, programLevelPath, programStepNewPath, programStepEditPath
- `src/shared/lib/subject-constants.ts` — DEFAULT_QURAN_SUBJECT_ID для src-слоя
- `src/shared/lib/student-progress/offsets.ts` — per-subject cache Map, invalidateStepOffsetCache(subjectId?)
- `src/features/program-admin/actions/program-actions.ts` — subject-scoped CRUD + deleteLevel
- `src/features/program-admin/actions/program-actions.test.ts` — mocked prisma vitest
- `src/shared/lib/student-progress/offsets.test.ts` — subject isolation tests
- `src/app/(dashboard)/admin/program/**` — удалено (D-06)

## Decisions Made

- DEFAULT_QURAN_SUBJECT_ID вынесен в `src/shared/lib/subject-constants.ts` (зеркало prisma/lib) для backward-compatible offsets без импорта из prisma/
- invalidateStepOffsetCache вызывается при всех мутациях программы

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added src/shared/lib/subject-constants.ts**
- **Found during:** Task 1 (offsets refactor)
- **Issue:** Plan требует DEFAULT_QURAN_SUBJECT_ID, но константа была только в prisma/lib — src не может импортировать
- **Fix:** Создан `src/shared/lib/subject-constants.ts` с тем же cuid
- **Files modified:** src/shared/lib/subject-constants.ts
- **Committed in:** c47682f

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Необходимо для backward-compatible offsets; без scope creep

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-04 может добавить subject-scoped program UI routes и обновить LevelsTable/StepForm
- program-paths и deleteLevel готовы для UI интеграции
- Offsets изолированы по subjectId для global step number в редакторе

## Self-Check: PASSED

- FOUND: src/features/program-admin/lib/program-paths.ts
- FOUND: src/shared/lib/subject-constants.ts
- FOUND: src/features/program-admin/actions/program-actions.test.ts
- FOUND: src/shared/lib/student-progress/offsets.test.ts
- FOUND: commit c47682f
- FOUND: commit e18e562
- FOUND: commit c93d3a7

---
*Phase: 10-subject-foundation*
*Completed: 2026-07-07*
