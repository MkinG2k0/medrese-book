---
phase: 01-student-analytics-history
plan: 01
subsystem: api
tags: [vitest, student-metrics, analytics, at-risk, time-norm]

requires: []
provides:
  - Модуль student-metrics с метриками периода, нормативом времени и riskFlags
  - AT_RISK_CONFIG (D-05) как единый конфиг порогов
  - Unit-тесты на граничные случаи prior credit / adjustment exclusion
affects:
  - 01-student-analytics-history (планы 01-02+)
  - analytics UI (AtRiskStudentsTable)
  - journal badge (JournalRiskBadge)

tech-stack:
  added: []
  patterns:
    - Чистые функции student-metrics без Prisma в unit-тестах
    - Фильтры countableSessionWhere / countableCompletionWhere из analytics-queries

key-files:
  created:
    - src/shared/lib/student-metrics/at-risk-config.ts
    - src/shared/lib/student-metrics/types.ts
    - src/shared/lib/student-metrics/period-metrics.ts
    - src/shared/lib/student-metrics/time-norm.ts
    - src/shared/lib/student-metrics/attendance-risk.ts
    - src/shared/lib/student-metrics/risk-flags.ts
    - src/shared/lib/student-metrics/index.ts
    - src/shared/lib/student-metrics/*.test.ts
  modified: []

key-decisions:
  - "localStepIdx вычисляется inline (currentStepIdx - offset) — импорт student-progress/index тянет Prisma в vitest"
  - "AtRiskStudentRow хранит actualMinutes/budgetMinutes числами; labels формируются в UI"

patterns-established:
  - "student-metrics: чистые функции на pre-loaded Prisma-данных, без импорта features"
  - "riskFlags: buildStudentRiskFlags композирует TIME_NORM и ATTENDANCE по enabledSignals"

requirements-completed: [ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-10]

coverage:
  - id: D1
    description: "Метрики периода исключают adjustment-сессии и prior credit completions"
    requirement: ANLY-03
    verification:
      - kind: unit
        ref: "src/shared/lib/student-metrics/period-metrics.test.ts#excludes adjustment sessions"
        status: pass
      - kind: unit
        ref: "src/shared/lib/student-metrics/period-metrics.test.ts#excludes prior credit completions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Прокси и teaching_session режимы totalMinutes (D-04)"
    requirement: ANLY-05
    verification:
      - kind: unit
        ref: "src/shared/lib/student-metrics/period-metrics.test.ts#uses proxy totalMinutes"
        status: pass
      - kind: unit
        ref: "src/shared/lib/student-metrics/period-metrics.test.ts#uses teaching_session duration"
        status: pass
    human_judgment: false
  - id: D3
    description: "Норматив времени по сумме Step.hours пройденных шагов уровня"
    requirement: ANLY-07
    verification:
      - kind: unit
        ref: "src/shared/lib/student-metrics/time-norm.test.ts#marks violation when actual minutes exceed budget"
        status: pass
    human_judgment: false
  - id: D4
    description: "Флаги посещаемости: 3+ ABSENT за месяц или 3 подряд (D-09)"
    requirement: ANLY-06
    verification:
      - kind: unit
        ref: "src/shared/lib/student-metrics/attendance-risk.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "buildStudentRiskFlags собирает TIME_NORM и ATTENDANCE по конфигу"
    requirement: ANLY-06
    verification:
      - kind: unit
        ref: "src/shared/lib/student-metrics/time-norm.test.ts#buildStudentRiskFlags"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-01
status: complete
---

# Phase 01 Plan 01: student-metrics Summary

**Типизированный модуль student-metrics: метрики периода, норматив времени по Step.hours и riskFlags с vitest-покрытием**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-01T16:20:00Z
- **Completed:** 2026-07-01T16:32:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Единый `AT_RISK_CONFIG` (D-05) с порогами посещаемости и режимами actualTimeSource
- `computePeriodMetrics` / `computeLevelProgress` с countable-фильтрами (ANLY-03, ANLY-04, ANLY-06, ANLY-10)
- `evaluateTimeNormForLevel`, `evaluateAttendanceRisk`, `buildStudentRiskFlags` (D-01…D-03, D-06, D-09)
- 17 unit-тестов, все проходят

## Task Commits

Each task was committed atomically:

1. **Task 1: Конфиг at-risk и типы DTO** - `0e6340e` (test)
2. **Task 2: Метрики периода и прогресс по уровню** - `79e2992` (feat)
3. **Task 3: Норматив времени, посещаемость и riskFlags** - `6ea6ac1` (feat)

## Files Created/Modified

- `src/shared/lib/student-metrics/at-risk-config.ts` — конфиг порогов D-05
- `src/shared/lib/student-metrics/types.ts` — DTO RiskFlag, StudentPeriodMetrics, TimeNormResult, AtRiskStudentRow
- `src/shared/lib/student-metrics/period-metrics.ts` — метрики периода и прогресс по уровню
- `src/shared/lib/student-metrics/time-norm.ts` — нарушение норматива по уровню
- `src/shared/lib/student-metrics/attendance-risk.ts` — правила пропусков D-09
- `src/shared/lib/student-metrics/risk-flags.ts` — сборка riskFlags D-06
- `src/shared/lib/student-metrics/index.ts` — публичный API модуля
- `src/shared/lib/student-metrics/*.test.ts` — unit-тесты

## Decisions Made

- `localStepIdx` вычисляется как `currentStepIdx - levelStepOffset` без импорта `student-progress/index` (избежание Prisma в vitest)
- DTO хранит минуты числами; UI-лейблы — ответственность потребителей (01-02, UI-SPEC)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma DATABASE_URL при импорте student-progress**
- **Found during:** Task 2 (period-metrics)
- **Issue:** `import { getLocalStepIdx } from '@/shared/lib/student-progress'` загружает prisma.ts и падает в vitest без DATABASE_URL
- **Fix:** Inline `currentStepIdx - levelStepOffset` (эквивалент getLocalStepIdx)
- **Files modified:** src/shared/lib/student-metrics/period-metrics.ts
- **Verification:** `pnpm test:unit -- src/shared/lib/student-metrics` — 17 passed
- **Committed in:** 79e2992

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Минимальный; семантика localStepIdx сохранена.

## TDD Gate Compliance

- RED commit: `0e6340e` (test)
- GREEN commits: `79e2992`, `6ea6ac1` (feat)
- Gate sequence: compliant

## Issues Encountered

None beyond Prisma import deviation (resolved inline).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Модуль готов для batch-запросов и API в плане 01-02
- UI (AtRiskStudentsTable, JournalRiskBadge) может импортировать типы и buildStudentRiskFlags

## Self-Check: PASSED

- FOUND: src/shared/lib/student-metrics/at-risk-config.ts
- FOUND: src/shared/lib/student-metrics/period-metrics.ts
- FOUND: src/shared/lib/student-metrics/time-norm.ts
- FOUND: src/shared/lib/student-metrics/attendance-risk.ts
- FOUND: src/shared/lib/student-metrics/risk-flags.ts
- FOUND: 0e6340e, 79e2992, 6ea6ac1

---
*Phase: 01-student-analytics-history*
*Completed: 2026-07-01*
