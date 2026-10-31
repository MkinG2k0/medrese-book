---
phase: 12-progress-sessions
plan: 03
subsystem: api
tags: [sessions-api, step-completions, journal-actions, groupId, enrollment]

requires:
  - phase: 12-progress-sessions
    plan: 02
    provides: recalculateStudentStepIdx(studentId, groupId) and syncCompletionsForProgress
provides:
  - POST/GET /api/sessions с обязательным groupId и enrollment-scoped upsert
  - step-completions DELETE/PATCH с recalculate по groupId из session FK
  - getStudentLesson/getStudentStepHistory с enrollment.currentStepIdx
affects: [12-04, 12-05, Phase 13 journal UI]

tech-stack:
  added: []
  patterns:
    - Session upsert keyed by studentId + date + groupId (D-04)
    - groupId resolved from session FK for completion mutations (T-12-06)
    - Journal data layer returns enrollment progress, not global Student idx

key-files:
  created: []
  modified:
    - src/app/api/sessions/route.ts
    - src/app/api/step-completions/route.ts
    - src/app/api/step-completions/[id]/route.ts
    - src/features/journal/actions/journal-actions.ts
    - src/features/journal/lib/get-student-session.ts
    - src/shared/lib/validations/step-completion.ts

key-decisions:
  - "PATCH/DELETE step-completions resolve groupId from session.groupId, not client-only (T-12-06)"
  - "findStudentSessionForDay accepts optional groupId for GET date-scoped lookup"
  - "getStudentLesson optional groupId param defaults to teacherGroup.id for Phase 13"

patterns-established:
  - "Sessions API: authorizeApiRequest with { studentId, groupId } + enrollment existence check"
  - "Journal lesson payload uses enrollment.currentStepIdx and group-scoped daySession"

requirements-completed: [SUBJ-09, SUBJ-10]

coverage:
  - id: D1
    description: POST/GET /api/sessions требует groupId, upsert по student+date+groupId, recalculate с groupId
    requirement: SUBJ-09
    verification:
      - kind: other
        ref: "rg groupId + recalculateStudentStepIdx(studentId, groupId in src/app/api/sessions/route.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: step-completions DELETE/PATCH вызывают recalculateStudentStepIdx с groupId enrollment
    requirement: SUBJ-10
    verification:
      - kind: other
        ref: "rg recalculateStudentStepIdx in src/app/api/step-completions/"
        status: pass
    human_judgment: false
  - id: D3
    description: getStudentLesson возвращает enrollment.currentStepIdx и daySession по groupId учителя
    requirement: SUBJ-09
    verification:
      - kind: other
        ref: "rg enrollment.currentStepIdx in src/features/journal/actions/journal-actions.ts"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-11
status: complete
---

# Phase 12 Plan 03: Group-Scoped Sessions API Summary

**POST/GET sessions, step-completions recalculate, and journal-actions wired to GroupEnrollment progress with groupId**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-11T20:50:00Z
- **Completed:** 2026-07-11T21:05:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- POST `/api/sessions` requires `groupId`, upserts by student+date+groupId, checks enrollment, calls `recalculateStudentStepIdx(studentId, groupId, tx)` (D-04, SUBJ-09)
- GET `/api/sessions` filters by optional `groupId`; `findStudentSessionForDay` accepts groupId parameter
- step-completions DELETE/PATCH resolve `groupId` from session FK and recalculate enrollment progress (SUBJ-10)
- `getStudentLesson` returns `enrollment.currentStepIdx`, filters daySession by teacher groupId, subject-scoped `getTotalProgramSteps`
- `getStudentStepHistory` uses enrollment progress instead of removed `Student.currentStepIdx`

## Task Commits

Each task was committed atomically:

1. **Task 1: POST/GET /api/sessions с groupId** - `a635f36` (feat)
2. **Task 2: step-completions routes с groupId** - `1b600fb` (feat)
3. **Task 3: journal-actions getStudentLesson и session lookup** - `02ed685` (feat)

## Files Created/Modified

- `src/app/api/sessions/route.ts` - Group-scoped session CRUD with enrollment check and recalculate
- `src/app/api/step-completions/route.ts` - DELETE with groupId from session FK
- `src/app/api/step-completions/[id]/route.ts` - PATCH recalculate via session.groupId
- `src/features/journal/actions/journal-actions.ts` - enrollment.currentStepIdx, group-scoped sessions, optional groupId param
- `src/features/journal/lib/get-student-session.ts` - findStudentSessionForDay groupId filter
- `src/shared/lib/validations/step-completion.ts` - optional groupId in delete schema

## Decisions Made

- PATCH/DELETE resolve groupId from session FK per threat model T-12-06 (not client-only)
- `getStudentLesson` accepts optional `groupId` defaulting to teacher's group for Phase 13 forward-compat
- Full TypeScript compile sweep deferred to plans 12-04/12-05 per plan verification note

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- API contracts ready for Phase 13 journal UI to pass groupId from group picker
- Remaining call sites (student-admin, group-actions) in plan 12-04; compile gate in 12-05

## Self-Check: PASSED

- FOUND: src/app/api/sessions/route.ts
- FOUND: src/app/api/step-completions/route.ts
- FOUND: src/app/api/step-completions/[id]/route.ts
- FOUND: src/features/journal/actions/journal-actions.ts
- FOUND: src/features/journal/lib/get-student-session.ts
- FOUND: a635f36, 1b600fb, 02ed685

---
*Phase: 12-progress-sessions*
*Completed: 2026-07-11*
