---
phase: 12-progress-sessions
plan: 01
subsystem: database
tags: [prisma, postgres, migration, zod, group-enrollment, session]

requires:
  - phase: 11-groups-enrollment
    provides: GroupEnrollment junction, primary enrollment pattern
provides:
  - GroupEnrollment.currentStepIdx as enrollment-scoped progress source
  - Session.groupId FK with unique studentId+date+groupId
  - Prod-safe migration with progress and session backfill
  - createSessionSchema with required groupId
affects: [12-02, 12-03, recalculate-step-progress, journal API]

tech-stack:
  added: []
  patterns:
    - Two-step nullable→backfill→NOT NULL for Session.groupId
    - Primary enrollment backfill via MIN(enrolledAt) per student

key-files:
  created:
    - prisma/migrations/20260711200000_enrollment_progress_and_session_group/migration.sql
    - src/shared/lib/validations/session.test.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/validations/session.ts

key-decisions:
  - "Migration SQL authored manually because DATABASE_URL targets remote Postgres and migrate dev is non-interactive"
  - "Adjustment session duplicates resolved by reassigning to secondary enrollment group when available"

patterns-established:
  - "Enrollment-scoped progress: GroupEnrollment.currentStepIdx replaces Student.currentStepIdx"
  - "Session uniqueness scoped to student + calendar day + group"

requirements-completed: [SUBJ-08, SUBJ-09]

coverage:
  - id: D1
    description: GroupEnrollment.currentStepIdx and Session.groupId in Prisma schema; Student.currentStepIdx removed
    requirement: SUBJ-08
    verification:
      - kind: other
        ref: "pnpm exec prisma validate"
        status: pass
    human_judgment: false
  - id: D2
    description: Prod-safe migration backfills enrollment progress and Session.groupId
    requirement: SUBJ-09
    verification:
      - kind: other
        ref: "pnpm db:migrate:deploy && pnpm exec prisma migrate status"
        status: pass
    human_judgment: false
  - id: D3
    description: createSessionSchema requires non-empty groupId
    requirement: SUBJ-09
    verification:
      - kind: unit
        ref: "src/shared/lib/validations/session.test.ts"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-07-11
status: complete
---

# Phase 12 Plan 01: Schema & Migration Summary

**Group-scoped progress on GroupEnrollment, Session.groupId with prod-safe backfill, and Zod session contract requiring groupId**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-11T20:43:00Z
- **Completed:** 2026-07-11T21:01:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `GroupEnrollment.currentStepIdx` and removed global `Student.currentStepIdx` (D-01…D-03)
- Added `Session.groupId` with FK, `@@unique([studentId, date, groupId])`, and `@@index([groupId, date])` (D-04)
- Created prod-safe migration with primary enrollment progress backfill, level offsets for secondary enrollments, and Session group backfill with fallbacks
- Applied migration; database schema is up to date
- Extended `createSessionSchema` with required `groupId` and Vitest coverage

## Task Commits

Each task was committed atomically:

1. **Task 1: Схема GroupEnrollment.currentStepIdx и Session.groupId** - `250e5c7` (feat)
2. **Task 2: Prod-safe миграция с backfill прогресса и сессий** - `a5ea9a6` (feat)
3. **Task 3: Применить миграцию и Zod session с groupId** - `0b0e7cc` (test), `5a0177a` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Enrollment progress field, Session.groupId, drop Student.currentStepIdx
- `prisma/migrations/20260711200000_enrollment_progress_and_session_group/migration.sql` - Backfill SQL per D-06, D-07, D-04
- `src/shared/lib/validations/session.ts` - Required groupId in createSessionSchema
- `src/shared/lib/validations/session.test.ts` - Validation tests for groupId

## Decisions Made

- Migration file created manually when `prisma migrate dev --create-only` failed in non-interactive mode against remote DATABASE_URL
- Applied via `pnpm db:migrate:deploy` per prisma-migrations rule for shared remote DB
- Adjustment sessions that would collide on unique constraint are reassigned to a secondary enrollment group when one exists

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Manual migration file instead of migrate dev**
- **Found during:** Task 2
- **Issue:** `pnpm db:migrate --create-only` failed (non-interactive + required column without default on remote DB with existing rows)
- **Fix:** Authored `20260711200000_enrollment_progress_and_session_group/migration.sql` manually with two-step Session.groupId backfill
- **Files modified:** prisma/migrations/20260711200000_enrollment_progress_and_session_group/migration.sql
- **Committed in:** a5ea9a6

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for prod-safe migration; no scope creep.

## Issues Encountered

- Remote DATABASE_URL prevented local `migrate dev`; resolved with manual SQL + `migrate deploy`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema and migration foundation ready for plan 12-02 (recalculate/sync per enrollment) and 12-03 (API groupId)
- Application code still references `Student.currentStepIdx` in places — expected follow-up in later plans

## Self-Check: PASSED

- FOUND: prisma/schema.prisma
- FOUND: prisma/migrations/20260711200000_enrollment_progress_and_session_group/migration.sql
- FOUND: src/shared/lib/validations/session.ts
- FOUND: src/shared/lib/validations/session.test.ts
- FOUND: 250e5c7, a5ea9a6, 0b0e7cc, 5a0177a

---
*Phase: 12-progress-sessions*
*Completed: 2026-07-11*
