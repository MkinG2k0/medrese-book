---
phase: 00-foundation
plan: 02
subsystem: database
tags: [prisma, analytics, filters, isAdjustment, isPriorCredit, vitest]

requires:
  - phase: 00-foundation-01
    provides: vitest + RED filters.test.ts
provides:
  - Session.isAdjustment and StepCompletion.isPriorCredit with data backfill migration
  - analytics-queries layer with mandatory countable filters
  - write-path flags in syncCompletionsForProgress
affects: [00-foundation-03, 00-foundation-04, phase-1-analytics]

tech-stack:
  added: []
  patterns:
    - "analytics-queries/filters.ts as single source of Prisma where fragments"
    - "analytics.ts thin re-export of analytics-queries"
    - "Boolean flags instead of note-based adjustment detection"

key-files:
  created:
    - prisma/migrations/20260624120000_foundation_analytics_flags/migration.sql
    - src/shared/lib/analytics-queries/filters.ts
    - src/shared/lib/analytics-queries/index.ts
    - src/shared/lib/analytics-queries/top-students.ts
    - src/shared/lib/analytics-queries/level-stats.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/analytics.ts
    - src/shared/lib/sync-completions-for-progress.ts

key-decisions:
  - "findFirst for adjustment session filters isAdjustment:true to avoid attaching backfill to lesson sessions"
  - "Resolved drifted Neon migrations with migrate resolve before deploy"

patterns-established:
  - "All analytics metrics use analyticsSessionFilter / analyticsCompletionFilter"
  - "Adjustment write path sets isAdjustment and isPriorCredit on create/update"

requirements-completed: [FND-01]

duration: 35min
completed: 2026-06-24
---

# Phase 0 Plan 02: Analytics Filters Summary

**Prisma flags isAdjustment/isPriorCredit with backfill, centralized analytics-queries filters excluding adjustment sessions and prior credit from all metrics**

## Performance

- **Duration:** 35 min
- **Started:** 2026-06-24T19:12:00Z
- **Completed:** 2026-06-24T19:47:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Добавлены `Session.isAdjustment` и `StepCompletion.isPriorCredit` с миграцией и SQL backfill существующих корректировок
- Миграция применена на Neon; Prisma Client сгенерирован с новыми полями
- `analytics-queries/` — единый слой фильтров; `getTopStudents` / `getLevelStats` исключают adjustment и prior credit
- `syncCompletionsForProgress` проставляет флаги при create/update; unit-тесты filters GREEN (4/4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema — isAdjustment, isPriorCredit + data migration SQL** - `88e53ec` (feat)
2. **Task 2: Применить миграцию БД** - (no commit — DB-only; migrate deploy applied `20260624120000_foundation_analytics_flags`)
3. **Task 3: analytics-queries + write-path flags + GREEN unit tests** - `9762a2c` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — boolean flags on Session and StepCompletion
- `prisma/migrations/20260624120000_foundation_analytics_flags/migration.sql` — schema + backfill SQL
- `src/shared/lib/analytics-queries/filters.ts` — countableSessionWhere, analyticsSessionFilter, etc.
- `src/shared/lib/analytics-queries/top-students.ts` — getTopStudents with filters
- `src/shared/lib/analytics-queries/level-stats.ts` — getLevelStats with filters
- `src/shared/lib/analytics-queries/index.ts` — barrel exports
- `src/shared/lib/analytics.ts` — parse/format helpers + re-export queries
- `src/shared/lib/sync-completions-for-progress.ts` — isAdjustment/isPriorCredit on write path

## Decisions Made

- Поиск adjustment-сессии по `isAdjustment: true` (не любая сессия за день) — предотвращает привязку backfill к уроку
- `prisma migrate resolve --applied` для drifted миграций на Neon перед deploy новой

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Resolved failed/drifted Neon migrations before deploy**
- **Found during:** Task 2 (Применить миграцию БД)
- **Issue:** P3009 failed `20260607120000_add_step_description`; P3018 duplicate column on `20260618120000_add_user_student_phones`
- **Fix:** `prisma migrate resolve --applied` для обеих, затем `prisma migrate deploy` для foundation_analytics_flags
- **Files modified:** none (DB state only)
- **Verification:** `prisma migrate status` — Database schema is up to date
- **Committed in:** N/A (operational DB fix)

**2. [Rule 2 - Missing Critical] Adjustment session lookup uses isAdjustment flag**
- **Found during:** Task 3 (write-path flags)
- **Issue:** findFirst по любой сессии за день мог привязать backfill к обычному уроку
- **Fix:** `where: { studentId, isAdjustment: true, date: dayRange }`
- **Files modified:** src/shared/lib/sync-completions-for-progress.ts
- **Verification:** grep confirms isAdjustment filter + create flags
- **Committed in:** 9762a2c

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Required for migration apply and correct write-path semantics; no scope creep

## Issues Encountered

Neon DB had migration history drift from prior partial applies — resolved with migrate resolve, not reset.

## User Setup Required

None — migration applied to configured DATABASE_URL.

## Next Phase Readiness

- FND-01 complete; analytics page uses filtered queries via analytics.ts re-export
- Plan 03 can implement authorizeApiRequest without analytics changes
- Manual gate: manager `/analytics` counts should exclude adjustments (see 00-VALIDATION.md)

## Self-Check: PASSED

- FOUND: prisma/migrations/20260624120000_foundation_analytics_flags/migration.sql
- FOUND: src/shared/lib/analytics-queries/filters.ts
- FOUND: 88e53ec, 9762a2c

---
*Phase: 00-foundation*
*Completed: 2026-06-24*
