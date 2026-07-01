---
phase: 01-student-analytics-history
plan: 02
subsystem: api
tags: [prisma, react-query, student-metrics, at-risk, rest-api]

requires:
  - phase: 01-student-analytics-history
    provides: student-metrics pure functions from plan 01-01
provides:
  - Prisma loaders loadStudentMetricsContext / getAtRiskStudents
  - REST API student-metrics, at-risk-students, students/risk-flags
  - React Query hooks in entities/student-metrics
  - sessionDurationMinutes in GET /api/step-completions
affects:
  - 01-student-analytics-history (plans 01-03+)
  - analytics UI AtRiskStudentsTable
  - journal JournalRiskBadge
  - StudentStudyHistoryModal

tech-stack:
  added: []
  patterns:
    - authorizeApiRequest + Zod safeParse on query params
    - buildTeachingSessionDurationByDate for group day→duration map
    - Entity hooks throw on json.error

key-files:
  created:
    - src/shared/lib/student-metrics/load-student-metrics.ts
    - src/shared/lib/analytics-queries/at-risk-students.ts
    - src/shared/lib/teaching-session-duration-map.ts
    - src/app/api/student-metrics/route.ts
    - src/app/api/at-risk-students/route.ts
    - src/app/api/students/risk-flags/route.ts
    - src/entities/student-metrics/
  modified:
    - src/shared/lib/analytics.ts
    - src/shared/lib/analytics-queries/index.ts
    - src/shared/lib/student-metrics/index.ts
    - src/app/api/step-completions/route.ts
    - src/entities/step-completion/api/use-step-completions.ts

key-decisions:
  - "durationMinutes вычисляется inline в shared (без импорта features/journal) — FSD"
  - "getAtRiskStudents использует loadStudentMetricsForMonth per student (N+1 допустим в плане)"

patterns-established:
  - "API student-metrics: periodMetrics + levelProgress без riskFlags для STUDENT portal"
  - "at-risk-students: default-deny STUDENT через allowedRoles"

requirements-completed: [ANLY-03, ANLY-04, ANLY-05, ANLY-07, ANLY-08, ANLY-09, ANLY-10]

coverage:
  - id: D1
    description: "loadStudentMetricsContext и getAtRiskStudents на Prisma"
    requirement: ANLY-07
    verification:
      - kind: unit
        ref: "pnpm test:unit -- src/shared/lib/student-metrics"
        status: pass
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /api/student-metrics с authorize studentId"
    requirement: ANLY-08
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Ручная проверка auth STUDENT self-only не автоматизирована в этом плане"
  - id: D3
    description: "GET /api/at-risk-students без роли STUDENT (D-07)"
    requirement: ANLY-06
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "403 для STUDENT требует cookie-сессии"
  - id: D4
    description: "GET /api/students/risk-flags batch для журнала"
    requirement: ANLY-06
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D5
    description: "step-completions sessionDurationMinutes для истории"
    requirement: ANLY-09
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-07-01
status: complete
---

# Phase 01 Plan 02: Data Layer API Summary

**Prisma-загрузчики student-metrics, три REST endpoint с auth, React Query hooks и sessionDurationMinutes в step-completions**

## Performance

- **Duration:** 28 min
- **Started:** 2026-07-01T16:24:00Z
- **Completed:** 2026-07-01T16:52:00Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- `loadStudentMetricsContext` оркестрирует period metrics, time norm, attendance risk и riskFlags
- `getAtRiskStudents` для SSR `/analytics` с фильтром teacherId
- API: `/api/student-metrics`, `/api/at-risk-students`, `/api/students/risk-flags`
- Entity hooks: `useStudentMetrics`, `useAtRiskStudents`, `useStudentRiskFlags`
- GET step-completions обогащён `sessionDurationMinutes` из TeachingSession группы

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma-загрузчики и getAtRiskStudents** - `22c29c7` (feat)
2. **Task 2: REST API student-metrics, at-risk, risk-flags** - `f2c8af0` (feat)
3. **Task 3: Длительность занятия в step-completions** - `75e2d9b` (feat)

## Files Created/Modified

- `src/shared/lib/student-metrics/load-student-metrics.ts` — Prisma + computePeriodMetrics/riskFlags
- `src/shared/lib/analytics-queries/at-risk-students.ts` — getAtRiskStudents(month, teacherId?)
- `src/shared/lib/teaching-session-duration-map.ts` — Map YYYY-MM-DD → durationMinutes
- `src/app/api/student-metrics/route.ts` — метрики периода + levelProgress
- `src/app/api/at-risk-students/route.ts` — список отстающих, STUDENT forbidden
- `src/app/api/students/risk-flags/route.ts` — batch riskFlags для журнала
- `src/entities/student-metrics/` — типы и React Query hooks
- `src/app/api/step-completions/route.ts` — sessionDurationMinutes в ответе

## Decisions Made

- durationMinutes в shared без импорта `features/journal` (FSD layer rule)
- cumulative actualMinutes для time norm по всем countable sessions ученика

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TS2322 в time-norm.test.ts для enabledSignals override**
- **Found during:** Task 1 verification
- **Issue:** `Pick<AtRiskConfig, 'enabledSignals'>` не принимал `['ATTENDANCE']`
- **Fix:** `config?: { enabledSignals: readonly RiskFlag[] }` в risk-flags.ts
- **Files modified:** src/shared/lib/student-metrics/risk-flags.ts
- **Committed in:** 22c29c7

**2. [Rule 2 - Missing Critical] FSD: shared не импортирует features**
- **Found during:** Task 1
- **Issue:** teaching-session-duration-map импортировал serializeTeachingSession из features
- **Fix:** inline getTeachingSessionDurationMinutes в shared
- **Files modified:** src/shared/lib/teaching-session-duration-map.ts
- **Committed in:** 22c29c7

**3. [Rule 3 - Blocking] Циклический импорт analytics ↔ at-risk-students**
- **Found during:** Task 1
- **Issue:** at-risk-students импортировал formatAnalyticsMonth из analytics.ts
- **Fix:** локальный formatMonthLabel в at-risk-students.ts
- **Files modified:** src/shared/lib/analytics-queries/at-risk-students.ts
- **Committed in:** 22c29c7

---

**Total deviations:** 3 auto-fixed (1 Rule 2, 2 Rule 3)
**Impact on plan:** Минимальный; контракты API и семантика сохранены.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth | src/app/api/at-risk-students/route.ts | default-deny STUDENT via allowedRoles |
| threat_flag: auth | src/app/api/student-metrics/route.ts | studentId scope via authorizeApiRequest |
| threat_flag: auth | src/app/api/students/risk-flags/route.ts | groupId context как students route |

## Issues Encountered

None beyond documented deviations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data layer готов для UI (01-04 AtRiskStudentsTable, JournalRiskBadge)
- getAtRiskStudents экспортирован из analytics.ts для SSR page
- step-completions несёт duration для StudentStudyHistoryModal

## Self-Check: PASSED

- FOUND: src/shared/lib/student-metrics/load-student-metrics.ts
- FOUND: src/app/api/at-risk-students/route.ts
- FOUND: src/entities/student-metrics/index.ts
- FOUND: 22c29c7, f2c8af0, 75e2d9b

---
*Phase: 01-student-analytics-history*
*Completed: 2026-07-01*
