---
phase: 14-analytics
plan: 03
subsystem: api
tags: [analytics, subject-scope, step-completions, react-query, vitest, playwright]

requires:
  - phase: 14-analytics
    plan: 01
    provides: subject picker, URL subjectId, TopStudents subjectId prop
  - phase: 14-analytics
    plan: 02
    provides: subject-scoped metrics queries
provides:
  - GET /api/step-completions?subjectId filters by session.group.subjectId
  - useStepCompletions optional subjectId with queryKey cache isolation
  - StudentStudyHistoryModal subject-scoped data via prop
  - E2E specs for subject picker and history modal with subjectId in URL
affects:
  - journal StepHistoryPage (legacy API path without subjectId unchanged)

tech-stack:
  added: []
  patterns:
    - "Subject-scoped completions exclude isPriorCredit and isAdjustment sessions (FND-01)"
    - "Duration map per session.groupId when subjectId provided; legacy primary enrollment otherwise"

key-files:
  created:
    - src/app/api/step-completions/route.test.ts
  modified:
    - src/app/api/step-completions/route.ts
    - src/entities/step-completion/api/use-step-completions.ts
    - src/features/analytics/ui/StudentStudyHistoryModal.tsx
    - src/features/analytics/ui/TopStudents.tsx
    - src/features/analytics/ui/AtRiskStudentsTable.tsx
    - src/app/(dashboard)/analytics/page.tsx
    - e2e/analytics-student-history.spec.ts
    - e2e/student-analytics.spec.ts
    - e2e/helpers/load-test-env.ts

key-decisions:
  - "AtRiskStudentsTable also receives subjectId — same modal entry point as TopStudents"
  - "Per-group duration maps when subjectId set; primary enrollment path preserved for journal"
  - "E2E subject-change/groupId-reset test skips when seed-e2e has single subject"

patterns-established:
  - "useStepCompletions queryKey includes subjectId ?? 'all' for destroyOnHidden cache reset"

requirements-completed: [SUBJ-14, SUBJ-15]

coverage:
  - id: D1
    description: "GET step-completions filters by session.group.subjectId when subjectId query param provided"
    requirement: SUBJ-14
    verification:
      - kind: unit
        ref: "src/app/api/step-completions/route.test.ts#filters completions by session.group.subjectId"
        status: pass
    human_judgment: false
  - id: D2
    description: "useStepCompletions accepts optional subjectId and includes it in fetch URL/queryKey"
    requirement: SUBJ-14
    verification:
      - kind: unit
        ref: "src/app/api/step-completions/route.test.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "StudentStudyHistoryModal shows subject-scoped completions; JSX structure unchanged (D-08)"
    requirement: SUBJ-15
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Modal data scope verified by wiring and API tests; visual/regression of modal layout not automated"
  - id: D4
    description: "E2E asserts subject combobox, subjectId in URL, history modal opens from analytics"
    requirement: SUBJ-14
    verification:
      - kind: e2e
        ref: "e2e/analytics-student-history.spec.ts"
        status: unknown
      - kind: e2e
        ref: "e2e/student-analytics.spec.ts"
        status: unknown
    human_judgment: true
    rationale: "Playwright suite blocked locally by Node 22.15 + Playwright 1.61 local TS import resolution; specs updated and ready for CI"

duration: 12min
completed: 2026-07-12
status: complete
---

# Phase 14 Plan 03: Subject-Scoped Study History Summary

**GET step-completions и модалка истории учёбы фильтруют completions по session.group.subjectId; journal path без subjectId сохранён**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-12T22:23:00Z
- **Completed:** 2026-07-12T22:35:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- API `GET /api/step-completions?subjectId=` фильтрует по `session.group.subjectId`, исключает prior credit и adjustment sessions
- `useStepCompletions(studentId, date?, subjectId?)` с изолированным queryKey для сброса кэша при смене предмета
- `StudentStudyHistoryModal` получает `subjectId` из `TopStudents` и `AtRiskStudentsTable` без изменения JSX модалки
- E2E specs обновлены: селект «Предмет», subjectId в URL, тест сброса groupId при смене предмета (skip при одном предмете в seed)

## Task Commits

Each task was committed atomically:

1. **Task 1: subjectId в API step-completions и useStepCompletions** — `af7e233` (test), `e61e9c6` (feat)
2. **Task 2: StudentStudyHistoryModal data scope** — `7c4e2c1` (feat)
3. **Task 3: E2E — subject picker и subject-scoped analytics** — `c461ebf` (test)

## Files Created/Modified

- `src/app/api/step-completions/route.ts` — subject filter, per-group duration maps, FND-01 exclusions
- `src/app/api/step-completions/route.test.ts` — unit tests for scoped and legacy paths
- `src/entities/step-completion/api/use-step-completions.ts` — optional subjectId param
- `src/features/analytics/ui/StudentStudyHistoryModal.tsx` — subjectId prop → hook
- `src/features/analytics/ui/TopStudents.tsx` — passes subjectId to modal
- `src/features/analytics/ui/AtRiskStudentsTable.tsx` — passes subjectId to modal (Rule 2)
- `e2e/analytics-student-history.spec.ts` — subject picker + URL assertions
- `e2e/student-analytics.spec.ts` — subject select in openHistoryModal; groupId reset test
- `e2e/helpers/load-test-env.ts` — manual .env.test parser (Node 22 / dotenv compat)

## Decisions Made

- AtRiskStudentsTable прокидывает subjectId — иначе at-risk клик открывал бы историю без subject scope
- Legacy journal call sites без subjectId не затронуты (primary enrollment duration path)
- E2E тест смены предмета использует `test.skip` когда в seed-e2e только один предмет

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] AtRiskStudentsTable subjectId wiring**
- **Found during:** Task 2 (tsc after modal prop added)
- **Issue:** AtRiskStudentsTable открывает ту же модалку без subjectId — TypeScript error и смешанные данные
- **Fix:** Добавлен prop `subjectId` в AtRiskStudentsTable и передача с analytics page
- **Files modified:** `AtRiskStudentsTable.tsx`, `analytics/page.tsx`
- **Verification:** `pnpm exec tsc --noEmit`
- **Committed in:** `7c4e2c1`

**2. [Rule 3 - Blocking] load-test-env dotenv import breaks Playwright on Node 22**
- **Found during:** Task 3 E2E verification
- **Issue:** `dotenv` ESM import через Playwright loader → `context.conditions?.includes is not a function`
- **Fix:** Ручной парсер `.env.test` в `load-test-env.ts` без зависимости от dotenv
- **Files modified:** `e2e/helpers/load-test-env.ts`
- **Verification:** Playwright config/global-setup загружаются; полный E2E run всё ещё блокируется local TS import resolution (см. Issues)
- **Committed in:** `c461ebf`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking partial)
**Impact on plan:** AtRiskStudentsTable — необходимо для корректного subject scope всех entry points модалки. load-test-env — частичный unblock Playwright infra.

## Issues Encountered

- **Playwright E2E не запускается локально (Node v22.15.0):** после загрузки config/global-setup тесты падают на import локальных helper-модулей (`auth-state.ts`) с `TypeError: context.conditions?.includes is not a function`. Unit/API regression (27 tests) и `tsc` проходят. E2E specs написаны; требуется прогон в CI или после обновления Playwright/Node toolchain.
- **db:seed:e2e:** таблица `Message` отсутствует в `.env.test` БД — seed падает; обход через `E2E_SKIP_SEED=1`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 14 subject-scoped analytics history complete (plans 01–03)
- E2E wave gate: прогнать `pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts` в CI после migrate + seed

## Self-Check: PASSED

- FOUND: src/app/api/step-completions/route.test.ts
- FOUND: .planning/phases/14-analytics/14-03-SUMMARY.md
- FOUND commits: af7e233, e61e9c6, 7c4e2c1, c461ebf

---
*Phase: 14-analytics*
*Completed: 2026-07-12*
