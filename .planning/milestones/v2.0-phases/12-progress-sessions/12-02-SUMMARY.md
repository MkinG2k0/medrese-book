---
phase: 12-progress-sessions
plan: 02
subsystem: progress
tags: [vitest, group-enrollment, recalculate, prior-credit, adjustment-session]

requires:
  - phase: 12-progress-sessions
    plan: 01
    provides: GroupEnrollment.currentStepIdx, Session.groupId schema
provides:
  - recalculateStudentStepIdx(studentId, groupId, tx?) writing to GroupEnrollment
  - syncCompletionsForProgress with groupId-scoped adjustment sessions
  - Unit tests for enrollment-scoped recalculate and sync
affects: [12-03, 12-04, 12-05, sessions API, student-admin]

tech-stack:
  added: []
  patterns:
    - Enrollment-scoped recalculate via findEnrollmentInGroup (not primary enrollment)
    - Adjustment session isolation per studentId + groupId + calendar day
    - Subject-scoped step offsets via enrollment.group.subjectId

key-files:
  created:
    - src/shared/lib/student-progress/recalculate.test.ts
    - src/shared/lib/student-progress/sync-for-progress.test.ts
  modified:
    - src/shared/lib/student-progress/recalculate.ts
    - src/shared/lib/student-progress/sync-for-progress.ts
    - src/shared/lib/recalculate-step-progress.ts
    - src/shared/lib/sync-completions-for-progress.ts

key-decisions:
  - "recalculateStudentStepIdx accepts (studentId, groupId) and writes only to GroupEnrollment per D-01/D-08"
  - "syncCompletionsForProgress filters adjustment sessions by groupId per SUBJ-10"
  - "Call sites left unchanged until plans 12-03/12-04 — expected TS errors until wave 3"

patterns-established:
  - "Runtime recalculate uses findEnrollmentInGroup, not findPrimaryEnrollment (D-06 migration-only)"
  - "Auto-promote next level filtered by enrollment.group.subjectId"

requirements-completed: [SUBJ-08, SUBJ-10]

coverage:
  - id: D1
    description: recalculateStudentStepIdx updates GroupEnrollment.currentStepIdx per enrollment
    requirement: SUBJ-08
    verification:
      - kind: unit
        ref: src/shared/lib/student-progress/recalculate.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Auto-promote updates only target enrollment levelId without Student side-effects
    requirement: SUBJ-08
    verification:
      - kind: unit
        ref: src/shared/lib/student-progress/recalculate.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: syncCompletionsForProgress creates and reuses adjustment sessions scoped by groupId
    requirement: SUBJ-10
    verification:
      - kind: unit
        ref: src/shared/lib/student-progress/sync-for-progress.test.ts
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-11
status: complete
---

# Phase 12 Plan 02: Enrollment-Scoped Progress Summary

**recalculateStudentStepIdx and syncCompletionsForProgress rewritten for GroupEnrollment scope with Vitest coverage**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-11T20:48:00Z
- **Completed:** 2026-07-11T21:00:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `recalculateStudentStepIdx(studentId, groupId, tx?)` loads enrollment via `findEnrollmentInGroup`, uses subject-scoped offsets, writes `GroupEnrollment.currentStepIdx` (D-01, D-03, D-08)
- Auto-promote updates only target enrollment `levelId` + `currentStepIdx`; next level filtered by `subjectId`
- `syncCompletionsForProgress(tx, studentId, groupId, ...)` creates/finds adjustment sessions per group per day (SUBJ-10)
- Six unit tests covering recalculate, auto-promote isolation, and group-scoped prior credit

## Task Commits

Each task was committed atomically:

1. **Task 1: recalculateStudentStepIdx per enrollment** - `38e4cd4` (test), `c77b84a` (feat)
2. **Task 2: syncCompletionsForProgress с groupId** - `c89f062` (test), `b070b03` (feat)
3. **Task 3: Barrel exports и JSDoc** - `bc4ce5d` (docs)

## Files Created/Modified

- `src/shared/lib/student-progress/recalculate.ts` - Enrollment-scoped recalculate with GroupEnrollment writes
- `src/shared/lib/student-progress/recalculate.test.ts` - Vitest mocks for recalculate and auto-promote
- `src/shared/lib/student-progress/sync-for-progress.ts` - groupId in adjustment session find/create
- `src/shared/lib/student-progress/sync-for-progress.test.ts` - Group isolation tests for prior credit
- `src/shared/lib/recalculate-step-progress.ts` - Deprecated re-export with Phase 12 note
- `src/shared/lib/sync-completions-for-progress.ts` - Deprecated re-export with Phase 12 note

## Decisions Made

- Runtime recalculate uses `findEnrollmentInGroup` — primary enrollment reserved for migration only (D-06)
- Call sites intentionally not updated in this plan; wave 3 (12-03/12-04) will wire groupId through API and actions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `student-progress` module ready for API wiring in plan 12-03 (sessions route groupId) and 12-04 (student-admin, group-actions call sites)
- Expected TypeScript errors at call sites until wave 3 — compile gate in 12-05

## Self-Check: PASSED

- FOUND: src/shared/lib/student-progress/recalculate.ts
- FOUND: src/shared/lib/student-progress/recalculate.test.ts
- FOUND: src/shared/lib/student-progress/sync-for-progress.ts
- FOUND: src/shared/lib/student-progress/sync-for-progress.test.ts
- FOUND: 38e4cd4, c77b84a, c89f062, b070b03, bc4ce5d

---
*Phase: 12-progress-sessions*
*Completed: 2026-07-11*
