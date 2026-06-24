---
phase: 00-foundation
plan: 04
subsystem: api
tags: [student-progress, prisma, transaction, currentStepIdx, playwright, FND-03]

requires:
  - phase: 00-foundation-02
    provides: isAdjustment/isPriorCredit flags + syncCompletionsForProgress write-path
  - phase: 00-foundation-03
    provides: authorizeApiRequest for sessions/step-completions API
provides:
  - Consolidated src/shared/lib/student-progress/ module (recalculate, sync, offsets, filters)
  - Deprecated re-exports on legacy paths
  - Atomic updateStudentProgress transaction (sync → update → recalculate)
  - All 7+ call sites import from @/shared/lib/student-progress
affects: [00-foundation-05, phase-1-analytics, student-portal, journal]

tech-stack:
  added: []
  patterns:
    - "student-progress/ as single domain module for currentStepIdx lifecycle"
    - "prisma.$transaction: syncCompletionsForProgress → student.update → recalculateStudentStepIdx(tx)"
    - "filters.ts domain helpers: isRealLessonSession, isCountableCompletion"

key-files:
  created:
    - src/shared/lib/student-progress/index.ts
    - src/shared/lib/student-progress/recalculate.ts
    - src/shared/lib/student-progress/sync-for-progress.ts
    - src/shared/lib/student-progress/offsets.ts
    - src/shared/lib/student-progress/filters.ts
    - src/shared/lib/student-progress/types.ts
  modified:
    - src/shared/lib/recalculate-step-progress.ts
    - src/shared/lib/sync-completions-for-progress.ts
    - src/shared/lib/step-offset.ts
    - src/features/student-admin/actions/student-admin-actions.ts
    - src/app/api/sessions/route.ts
    - src/app/api/step-completions/route.ts
    - src/app/api/step-completions/[id]/route.ts
    - src/features/journal/actions/journal-actions.ts
    - src/features/user-admin/actions/user-actions.ts
    - src/features/student-portal/actions/student-actions.ts
    - e2e/student-progress.spec.ts
    - e2e/helpers/db.ts
    - e2e/helpers/antd.ts

key-decisions:
  - "Defensive recalculate in getStudentLesson() not present — deferred to Phase 1 per plan interfaces note"
  - "Legacy paths kept as @deprecated re-exports for backward compatibility"
  - "dispatchDomainEvent not wired here — plan 05 scope"

patterns-established:
  - "All progress mutations call recalculateStudentStepIdx; admin edit uses single transaction"
  - "E2E verifies journal API, student portal UI, and analytics table agree on countable steps"

requirements-completed: [FND-03]

duration: 25min
completed: 2026-06-24
---

# Phase 0 Plan 04: Student Progress Module Summary

**Консолидация логики currentStepIdx в `student-progress/`, атомарный admin edit и e2e-согласованность журнала, портала и аналитики**

## Performance

- **Duration:** 25 min (verification + SUMMARY; implementation pre-committed)
- **Started:** 2026-06-24T17:01:57Z
- **Completed:** 2026-06-24T17:30:00Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Модуль `src/shared/lib/student-progress/` с 6 файлами: recalculate (level auto-advance), sync-for-progress (`isAdjustment`/`isPriorCredit`), offsets, filters, types, index
- Старые пути (`recalculate-step-progress.ts`, `sync-completions-for-progress.ts`, `step-offset.ts`) — deprecated re-export
- 7 call sites переведены на `@/shared/lib/student-progress`; прямых импортов legacy из `features/` и `app/api/` нет
- `updateStudentProgress`: один `prisma.$transaction` — sync → update level/step → recalculateStudentStepIdx(tx)
- e2e `student-progress.spec.ts` GREEN: manager меняет шаг → journal API, student portal и analytics показывают согласованный прогресс; prior-credit/adjustment исключены из countable метрик

## Task Commits

Each task was committed atomically (task 3 spans two commits from prior session — see Deviations):

1. **Task 1: Создать модуль student-progress** - `f03524a` (feat)
2. **Task 2: Обновить call sites + атомарный updateStudentProgress** - `f084456` (feat)
3. **Task 3: GREEN e2e student-progress.spec.ts** - `bb9ca44`, `19832d4` (test)

## Files Created/Modified

- `src/shared/lib/student-progress/` — публичный API: recalculateStudentStepIdx, syncCompletionsForProgress, offset helpers, isCountableCompletion, isRealLessonSession
- `src/features/student-admin/actions/student-admin-actions.ts` — атомарная транзакция updateStudentProgress
- `src/app/api/sessions/route.ts`, step-completions routes — recalculateStudentStepIdx после мутации
- `e2e/student-progress.spec.ts` — FND-03: admin edit → journal/portal/analytics consistency
- `e2e/helpers/db.ts` — countStudentCountableCompletionsInMonth, prior-credit/adjustment counters
- `e2e/helpers/antd.ts` — selectStudentProgressStep helper

## Decisions Made

- `getStudentLesson()` не вызывает recalculateStudentStepIdx (defensive read-path отсутствует) — удаление/добавление отложено на Phase 1, как указано в PLAN.md interfaces
- dispatchDomainEvent не подключён в updateStudentProgress — scope plan 05

## Deviations from Plan

### Prior-session commit hygiene

**1. Task 3 split across two non-standard commits**
- **Found during:** Task 3 verification
- **Issue:** e2e GREEN work landed in `bb9ca44` (`test`) and `19832d4` (`test2`) instead of single `test(00-foundation-04):` commit
- **Impact:** Functionally complete; commit messages do not follow GSD convention. `bb9ca44` also includes unrelated `UsersTable.tsx` formatting and `.planning/config.json` tweak.

Otherwise plan executed as written — module, call sites, transaction, and e2e behavior match acceptance criteria.

## Issues Encountered

- Playwright failed when reusing dev server on :3000 (`.env` DB ≠ `.env.test` DB → 404 on student edit). Resolved by running Playwright with its own webServer on :3001 (test env).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FND-03 complete; ready for plan 05 (domain events / dispatchDomainEvent on progress change)
- Phase 1 may remove defensive recalculate from read paths if added later

## Self-Check: PASSED

- FOUND: `.planning/phases/00-foundation/00-04-SUMMARY.md`
- FOUND: `f03524a`, `f084456`, `bb9ca44`, `19832d4`
- FOUND: `src/shared/lib/student-progress/index.ts`
- VERIFY: `pnpm exec tsc --noEmit` — no student-progress errors
- VERIFY: `pnpm run build` — Compiled successfully
- VERIFY: `pnpm exec playwright test e2e/student-progress.spec.ts` — 1 passed

---
*Phase: 00-foundation*
*Completed: 2026-06-24*
