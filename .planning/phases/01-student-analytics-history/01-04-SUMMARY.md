---
phase: 01-student-analytics-history
plan: 04
subsystem: ui
tags: [analytics, student-portal, at-risk, antd, history]

requires:
  - phase: 01-student-analytics-history
    provides: getAtRiskStudents, StudentMetricsCards, sessionDurationMinutes API from plans 01-02/01-03
provides:
  - AtRiskStudentsTable on /analytics (first block, D-08)
  - StudentMetricsCards portal wiring on /student/me without at-risk (D-07)
  - Session duration column in history modal and /student/history
affects:
  - 01-student-analytics-history plan 01-05 (E2E verification)

tech-stack:
  added: []
  patterns:
    - AtRiskStudentsTable reuses JournalRiskBadge and TopStudents modal pattern
    - getStudentPeriodMetrics returns periodMetrics only (no riskFlags)
    - Portal history duration via buildTeachingSessionDurationByDate SSR map

key-files:
  created:
    - src/features/analytics/ui/AtRiskStudentsTable.tsx
  modified:
    - src/app/(dashboard)/analytics/page.tsx
    - src/app/(dashboard)/student/me/page.tsx
    - src/features/student-portal/actions/student-actions.ts
    - src/features/analytics/ui/StudentStudyHistoryModal.tsx
    - src/features/student-portal/ui/StudentSessionsTable.tsx

key-decisions:
  - "Teacher column in at-risk table gated by selectedTeacher === ALL_TEACHERS"
  - "Portal metrics use loadStudentMetricsForMonth; riskFlags never exposed to student"

patterns-established:
  - "At-risk row click opens StudentStudyHistoryModal (same as TopStudents)"
  - "Duration duplicated per step row within same session date in history tables"

requirements-completed: [ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-08, ANLY-09]

coverage:
  - id: D1
    description: "AtRiskStudentsTable первым блоком на /analytics с drill-down в историю"
    requirement: ANLY-07
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Порядок блоков и row-click modal требуют визуальной проверки"
  - id: D2
    description: "StudentMetricsCards variant portal на /student/me без at-risk"
    requirement: ANLY-03
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Размещение карточек под ProgressBar требует ручной проверки UI"
  - id: D3
    description: "Колонка длительности в StudentStudyHistoryModal и StudentSessionsTable"
    requirement: ANLY-08
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Форматирование duration и em-dash при null требует проверки с данными"

duration: 30min
completed: 2026-07-01
status: complete
---

# Phase 01 Plan 04: Analytics & Portal UI Summary

**At-risk таблица на аналитике, метрики периода в портале ученика и длительность занятий в истории**

## Performance

- **Duration:** 30 min
- **Started:** 2026-07-01T20:00:00Z
- **Completed:** 2026-07-01T20:30:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `AtRiskStudentsTable` — первый блок на `/analytics` (AtRisk → TopStudents → LevelStats)
- `getStudentPeriodMetrics` + `StudentMetricsCards variant=portal` на `/student/me` без at-risk
- Колонка «Длительность занятия» в модалке истории и таблице `/student/history`

## Task Commits

Each task was committed atomically:

1. **Task 1: AtRiskStudentsTable и страница /analytics** - `421c1e4` (feat)
2. **Task 2: StudentMetricsCards на портале ученика** - `ce07415` (feat)
3. **Task 3: История с длительностью занятия** - `38f4a08` (feat)

## Files Created/Modified

- `src/features/analytics/ui/AtRiskStudentsTable.tsx` — таблица отстающих per UI-SPEC
- `src/app/(dashboard)/analytics/page.tsx` — SSR getAtRiskStudents, порядок блоков
- `src/app/(dashboard)/student/me/page.tsx` — метрики периода под ProgressBar
- `src/features/student-portal/actions/student-actions.ts` — getStudentPeriodMetrics, duration в history
- `src/features/analytics/ui/StudentStudyHistoryModal.tsx` — колонка длительности
- `src/features/student-portal/ui/StudentSessionsTable.tsx` — колонка «Длительность»

## Decisions Made

- Колонка «Преподаватель» скрыта при выборе конкретного учителя в фильтре
- Portal metrics возвращают только `periodMetrics`, без `riskFlags` (D-07)

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth | src/app/(dashboard)/analytics/page.tsx | requireRoles на page; at-risk только teacher/manager/admin |
| threat_flag: auth | src/features/student-portal/actions/student-actions.ts | getStudentPeriodMetrics без riskFlags для STUDENT |

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UI слой аналитики и портала готов для 01-05 (E2E verification)
- Все ANLY-03…09 закрыты в UI; ANLY-10 остаётся для plan 05

## Self-Check: PASSED

- FOUND: src/features/analytics/ui/AtRiskStudentsTable.tsx
- FOUND: src/app/(dashboard)/analytics/page.tsx
- FOUND: src/app/(dashboard)/student/me/page.tsx
- FOUND: 421c1e4, ce07415, 38f4a08

---
*Phase: 01-student-analytics-history*
*Completed: 2026-07-01*
