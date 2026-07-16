---
phase: 260716-mp1-bulk-add-students-to-group
plan: 01
subsystem: groups
tags: [enrollment, bulk, prisma, antd, playwright, zod]

requires:
  - phase: 11-groups-enrollment
    provides: enrollStudent + EnrollStudentModal + GroupEnrollment pattern
provides:
  - enrollStudentsSchema for multi-student enrollment payload
  - enrollStudents server action with single transaction batch create
  - Multi-select EnrollStudentModal with shared level/step
  - E2E coverage for single and bulk enroll on group page
affects: [groups, journal]

tech-stack:
  added: []
  patterns:
    - Shared createEnrollmentInTx helper for single and bulk enroll paths
    - Pre-check findMany duplicates before $transaction abort-all

key-files:
  created: []
  modified:
    - src/shared/lib/validations/enrollment.ts
    - src/features/groups/actions/group-actions.ts
    - src/features/groups/actions/group-actions.test.ts
    - src/features/groups/ui/EnrollStudentModal.tsx
    - src/features/groups/ui/GroupStudentsTable.tsx
    - e2e/groups-enrollment.spec.ts

key-decisions:
  - "enrollStudent keeps public contract; shared helper used by enrollStudents"
  - "Duplicate check aborts entire batch with Russian error before create"
  - "UI always multi-select; single enroll is selecting one student"

patterns-established:
  - "Bulk enroll: validate → subject/level guard → findMany duplicates → one $transaction"

requirements-completed: [QUICK-bulk-enroll]

coverage:
  - id: D1
    description: enrollStudents creates multiple GroupEnrollment rows in one transaction
    requirement: QUICK-bulk-enroll
    verification:
      - kind: unit
        ref: src/features/groups/actions/group-actions.test.ts#enrollStudents creates enrollments for two students in one transaction
        status: pass
    human_judgment: false
  - id: D2
    description: Duplicate and wrong-subject enrollments are rejected
    requirement: QUICK-bulk-enroll
    verification:
      - kind: unit
        ref: src/features/groups/actions/group-actions.test.ts#enrollStudents rejects/throws cases
        status: pass
    human_judgment: false
  - id: D3
    description: Manager can multi-select students and enroll them from group page
    requirement: QUICK-bulk-enroll
    verification:
      - kind: e2e
        ref: e2e/groups-enrollment.spec.ts#зачисляет нескольких учеников одним действием
        status: unknown
    human_judgment: false
    rationale: E2E not run in this session (requires test DB); unit + tsc verified

duration: 8min
completed: 2026-07-16
status: complete
---

# Phase 260716-mp1 Plan 01: Bulk add students to group Summary

**Менеджер зачисляет нескольких существующих учеников в группу одним действием через multi-select и `enrollStudents`.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-16T13:23:00Z
- **Completed:** 2026-07-16T13:28:00Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Добавлен `enrollStudentsSchema` / `enrollStudents` с одной Prisma-транзакцией на batch
- `EnrollStudentModal` переведён на multi-select с общим уровнем и шагом
- Unit-тесты bulk + сохранение single `enrollStudent`; E2E single/bulk обновлены

## Task Commits

1. **Task 1: enrollStudents schema + action + unit tests** - `028afbc` (feat)
2. **Task 2: Multi-select UI + E2E bulk enroll** - `9f7f8df` (feat)

**Plan metadata:** skipped (orchestrator commits docs)

## Files Created/Modified

- `src/shared/lib/validations/enrollment.ts` — `enrollStudentsSchema` + `EnrollStudentsInput`
- `src/features/groups/actions/group-actions.ts` — `enrollStudents`, shared helper, take=200
- `src/features/groups/actions/group-actions.test.ts` — bulk happy/duplicate/subject tests
- `src/features/groups/ui/EnrollStudentModal.tsx` — multi-select UI на русском
- `src/features/groups/ui/GroupStudentsTable.tsx` — кнопка «Добавить учеников»
- `e2e/groups-enrollment.spec.ts` — single адаптирован, bulk сценарий добавлен

## Decisions Made

- Публичный контракт `enrollStudent` сохранён; общая логика вынесена в `createEnrollmentInTx` / `resolveEnrollmentTarget`
- При любом дубликате в batch — throw, create не вызывается
- UI всегда множественный выбор; одиночное зачисление = один id в `studentIds`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. E2E Playwright не запускался в этой сессии (нужна test DB); verify: vitest + `tsc --noEmit` пройдены.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Bulk enroll existing students готов к использованию. Out of scope остаётся: bulk create через createUsers, CSV-import.

## Self-Check: PASSED

- FOUND: enrollment.ts, group-actions.ts, group-actions.test.ts, EnrollStudentModal.tsx, GroupStudentsTable.tsx, groups-enrollment.spec.ts
- FOUND commits: `028afbc`, `9f7f8df`

---
*Phase: 260716-mp1-bulk-add-students-to-group*
*Completed: 2026-07-16*
