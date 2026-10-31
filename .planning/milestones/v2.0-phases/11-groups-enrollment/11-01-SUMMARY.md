---
phase: 11-groups-enrollment
plan: 01
subsystem: database
tags: [prisma, zod, enrollment, migration, postgresql]

requires:
  - phase: 10-subject-foundation
    provides: Subject model, DEFAULT_QURAN_SUBJECT_ID, subject-scoped Level
provides:
  - Group.subjectId FK to Subject (NOT NULL)
  - GroupEnrollment junction with levelId and enrolledAt
  - Prod-safe migration with Student.groupId/levelId backfill
  - Zod schemas group.ts and enrollment.ts
  - Wave 0 unit tests enrollment.test.ts
affects: [11-02, 11-03, 11-04, journal-api, user-admin, seed]

tech-stack:
  added: []
  patterns:
    - "Explicit junction GroupEnrollment с @@unique([studentId, groupId])"
    - "Prod-safe migration: ADD nullable → UPDATE backfill → NOT NULL → INSERT junction → DROP legacy columns"
    - "assertLevelBelongsToGroupSubject sync guard для unit-тестов"

key-files:
  created:
    - prisma/migrations/20260707200000_group_enrollment/migration.sql
    - src/shared/lib/validations/group.ts
    - src/shared/lib/validations/enrollment.ts
    - src/shared/lib/validations/enrollment.test.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Имя junction — GroupEnrollment (не StudentGroup) per RESEARCH"
  - "Backfill Group.subjectId через DEFAULT_QURAN_SUBJECT_ID = clq10defaultquransubject00"
  - "updateGroupSchema без subjectId — immutable после создания (D-07)"
  - "Нет @@unique([studentId, subjectId]) — разрешены несколько групп одного предмета (D-10)"

patterns-established:
  - "GroupEnrollment: onDelete Cascade на student/group, Restrict на level"
  - "Валидация level ∈ subject через assertLevelBelongsToGroupSubject + будущий Prisma findFirst в actions"

requirements-completed: [SUBJ-05, SUBJ-06]

coverage:
  - id: D1
    description: "Group.subjectId NOT NULL FK к Subject"
    requirement: SUBJ-05
    verification:
      - kind: unit
        ref: "pnpm exec prisma validate"
        status: pass
    human_judgment: false
  - id: D2
    description: "GroupEnrollment junction — единственный источник зачислений"
    requirement: SUBJ-06
    verification:
      - kind: unit
        ref: "pnpm exec prisma migrate status"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zod createGroupSchema с обязательным subjectId"
    requirement: SUBJ-05
    verification:
      - kind: unit
        ref: "src/shared/lib/validations/enrollment.test.ts#createGroupSchema отклоняет пустой subjectId"
        status: pass
    human_judgment: false
  - id: D4
    description: "Zod updateGroupSchema без subjectId"
    requirement: SUBJ-07
    verification:
      - kind: unit
        ref: "src/shared/lib/validations/enrollment.test.ts#updateGroupSchema не содержит поля subjectId"
        status: pass
    human_judgment: false
  - id: D5
    description: "enrollStudentSchema и assertLevelBelongsToGroupSubject guard"
    requirement: SUBJ-06
    verification:
      - kind: unit
        ref: "src/shared/lib/validations/enrollment.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Backfill Student.groupId → GroupEnrollment на prod DB"
    requirement: SUBJ-06
    verification: []
    human_judgment: true
    rationale: "COUNT-проверка backfill выполнена при migrate deploy; полная prod-верификация — staging/UAT"

duration: 5min
completed: 2026-07-07
status: complete
---

# Phase 11 Plan 01: Schema & Migration Summary

**Group.subjectId, junction GroupEnrollment с prod-backfill и Zod-валидации зачисления (Wave 0 unit-тесты)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-07T20:06:00Z
- **Completed:** 2026-07-07T20:11:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Схема Prisma: `Group.subjectId`, модель `GroupEnrollment`, `Student` без `groupId`/`levelId`
- Prod-safe миграция `20260707200000_group_enrollment` с backfill через `DEFAULT_QURAN_SUBJECT_ID` и переносом 22 записей Student → GroupEnrollment
- Zod-модули `group.ts` и `enrollment.ts` с синхронным guard `assertLevelBelongsToGroupSubject`
- Wave 0: 5 unit-тестов в `enrollment.test.ts` — все зелёные

## Task Commits

Each task was committed atomically:

1. **Task 1: Group.subjectId и модель GroupEnrollment в schema** - `b1a22b7` (feat)
2. **Task 2: Prod-safe миграция с backfill** - `46f8ec5` (feat)
3. **Task 3: Zod group/enrollment и unit-тесты (Wave 0)** - `c116966` (test) + `c26aaac` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `prisma/schema.prisma` — Group.subjectId, GroupEnrollment, Student без legacy FK
- `prisma/migrations/20260707200000_group_enrollment/migration.sql` — backfill и DROP legacy columns
- `src/shared/lib/validations/group.ts` — createGroupSchema, updateGroupSchema
- `src/shared/lib/validations/enrollment.ts` — enroll/unenroll schemas, level guard
- `src/shared/lib/validations/enrollment.test.ts` — Wave 0 unit-тесты

## Decisions Made

- Junction назван `GroupEnrollment` per RESEARCH discretion
- ID записей backfill через `gen_random_uuid()::text` в SQL (cuid-совместимый текст)
- `updateGroupSchema` не принимает `subjectId` — Zod strip unknown keys (D-07)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ручное создание migration.sql**

- **Found during:** Task 2 (Prod-safe миграция)
- **Issue:** `prisma migrate dev` не работает в неинтерактивном режиме и требует ручного SQL для backfill subjectId
- **Fix:** Создана миграция `20260707200000_group_enrollment` вручную по образцу Phase 10; применена через `pnpm db:migrate:deploy`
- **Files modified:** `prisma/migrations/20260707200000_group_enrollment/migration.sql`
- **Verification:** `prisma migrate status` — up to date; `prisma validate` — OK
- **Committed in:** `46f8ec5`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Необходимо для prod-safe backfill; логика миграции соответствует плану.

## Issues Encountered

- `prisma migrate dev --create-only` отклонён в non-interactive среде — обход через ручной SQL + `migrate deploy`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Схема и миграция готовы для plan 11-02 (UI групп с предметом) и 11-03 (enrollment server actions)
- **Блокер для runtime:** ~25 файлов всё ещё ссылаются на `student.groupId` / `group.students` — адаптация в планах 11-02+
- `generated/prisma` содержит `GroupEnrollment` после `prisma generate`

## Self-Check: PASSED

- FOUND: prisma/schema.prisma
- FOUND: prisma/migrations/20260707200000_group_enrollment/migration.sql
- FOUND: src/shared/lib/validations/group.ts
- FOUND: src/shared/lib/validations/enrollment.ts
- FOUND: src/shared/lib/validations/enrollment.test.ts
- FOUND: b1a22b7
- FOUND: 46f8ec5
- FOUND: c116966
- FOUND: c26aaac

---
*Phase: 11-groups-enrollment*
*Completed: 2026-07-07*
