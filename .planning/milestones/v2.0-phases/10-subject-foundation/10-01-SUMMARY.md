---
phase: 10-subject-foundation
plan: 01
subsystem: database
tags: [prisma, postgres, zod, subject, migration]

requires: []
provides:
  - Subject Prisma model with name and description
  - Level.subjectId FK with composite unique (subjectId, number)
  - Prod-safe migration with Quran backfill via fixed cuid
  - DEFAULT_QURAN_SUBJECT_ID constant shared with migration SQL
  - Zod schemas for subject and level create/update input
affects:
  - 10-02-PLAN (subject-admin CRUD)
  - 10-03-PLAN (program-admin subject scoping)
  - 10-05-PLAN (seed three subjects)

tech-stack:
  added: []
  patterns:
    - "Additive migration: nullable column → backfill → NOT NULL → FK"
    - "Fixed cuid constant in prisma/lib for migration/seed alignment"

key-files:
  created:
    - prisma/lib/subject-constants.ts
    - prisma/migrations/20260707180000_add_subject/migration.sql
    - src/shared/lib/validations/subject.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/validations/level.ts

key-decisions:
  - "Migration SQL written manually — migrate dev blocked in non-interactive env with existing Level rows"
  - "Migration not applied to remote DATABASE_URL per prisma-migrations rule (deploy separately)"

patterns-established:
  - "Subject owns Levels; uniqueness scoped by @@unique([subjectId, number])"
  - "DEFAULT_QURAN_SUBJECT_ID clq10defaultquransubject00 matches migration INSERT"

requirements-completed: [SUBJ-02, SUBJ-03, SUBJ-18]

coverage:
  - id: D1
    description: "Subject model and Level.subjectId in Prisma schema"
    requirement: SUBJ-18
    verification:
      - kind: other
        ref: "pnpm exec prisma validate"
        status: pass
    human_judgment: false
  - id: D2
    description: "Prod-safe migration with Quran backfill and composite unique index"
    requirement: SUBJ-18
    verification:
      - kind: other
        ref: "pnpm exec prisma migrate status (pending on remote — not applied per prod-safe rule)"
        status: unknown
    human_judgment: true
    rationale: "Migration file committed but not deployed to remote DB from executor; deploy requires pnpm db:migrate:deploy on target environment"
  - id: D3
    description: "Zod validation for subject create/update and level create with subjectId"
    requirement: SUBJ-02
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit (no errors in validations/subject or validations/level)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-07
status: complete
---

# Phase 10 Plan 01: Subject Foundation Schema Summary

**Subject model, prod-safe Level.subjectId migration with Quran backfill, and Zod validation foundations**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-07T17:52:00Z
- **Completed:** 2026-07-07T18:17:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Добавлена модель `Subject` и обязательный `Level.subjectId` с `@@unique([subjectId, number])`
- Создана prod-safe миграция с backfill существующих уровней в предмет «Коран» через фиксированный cuid
- Добавлены Zod-схемы `createSubjectSchema`/`updateSubjectSchema` и `subjectId` в `createLevelSchema`

## Task Commits

Each task was committed atomically:

1. **Task 1: Subject model and Level.subjectId in schema** - `dbb9e74` (feat)
2. **Task 2: Prod-safe migration with fixed Quran subject cuid** - `b7fe506` (feat)
3. **Task 3: Zod validation for subject and level** - `fdc4f11` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — модель Subject, Level.subjectId, composite unique
- `prisma/migrations/20260707180000_add_subject/migration.sql` — CREATE TABLE, backfill, индексы
- `prisma/lib/subject-constants.ts` — DEFAULT_QURAN_SUBJECT_ID
- `src/shared/lib/validations/subject.ts` — create/update subject schemas
- `src/shared/lib/validations/level.ts` — subjectId в createLevelSchema

## Decisions Made

- Миграция создана вручную: `prisma migrate dev` не работает в non-interactive режиме при наличии строк в Level
- Миграция не применена к удалённой БД (DATABASE_URL → test/prod) — только файл в репозитории; deploy через `pnpm db:migrate:deploy`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Manual migration file creation**
- **Found during:** Task 2 (Prod-safe migration)
- **Issue:** `pnpm db:migrate` failed — non-interactive environment and required column without default on 5 existing Level rows
- **Fix:** Created `20260707180000_add_subject/migration.sql` manually with nullable→backfill→NOT NULL pattern per RESEARCH Pattern 4
- **Files modified:** prisma/migrations/20260707180000_add_subject/migration.sql
- **Verification:** `prisma validate` passes; `migrate status` shows pending migration
- **Committed in:** b7fe506

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Manual migration matches plan intent; deploy deferred per prisma-migrations rule for remote DB.

## Issues Encountered

- Remote DATABASE_URL prevents local `migrate dev` apply — migration committed but pending deploy on target environment

## User Setup Required

None for code. **Deploy step:** run `pnpm db:migrate:deploy` on test/staging/prod before deploying app code that uses Subject.

## Next Phase Readiness

- Schema and validations ready for 10-02 (subject-admin CRUD server actions)
- Blocker: migration must be deployed before runtime code queries Subject table

## Self-Check: PASSED

- FOUND: prisma/schema.prisma
- FOUND: prisma/migrations/20260707180000_add_subject/migration.sql
- FOUND: prisma/lib/subject-constants.ts
- FOUND: src/shared/lib/validations/subject.ts
- FOUND: src/shared/lib/validations/level.ts
- FOUND: dbb9e74
- FOUND: b7fe506
- FOUND: fdc4f11

---
*Phase: 10-subject-foundation*
*Completed: 2026-07-07*
