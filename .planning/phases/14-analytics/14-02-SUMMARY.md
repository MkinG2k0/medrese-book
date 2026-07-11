---
phase: 14-analytics
plan: 02
subsystem: api
tags: [analytics, subject-scope, prisma, vitest, nextjs, react-query]

requires:
  - phase: 14-analytics
    plan: 01
    provides: subject filter in URL, resolveAnalyticsSubjectFilter, placeholder gate
provides:
  - getTopStudents/getLevelStats/getAtRiskStudents with mandatory subjectId
  - loadStudentMetricsForMonth with scope { subjectId, groupId? } and worst-case enrollment
  - /analytics page loads subject-scoped metrics (top, levels, at-risk)
  - at-risk API and useAtRiskStudents require subjectId
affects:
  - 14-03 StudentStudyHistoryModal subject scope
  - journal/student-portal metrics call sites

tech-stack:
  added: []
  patterns:
    - "Analytics queries filter via session.group.subjectId and Level.subjectId"
    - "Student metrics worst-case enrollment when multiple groups in same subject"
    - "TopStudents accepts subjectId prop for downstream history modal wiring"

key-files:
  created:
    - src/shared/lib/analytics-queries/top-students.test.ts
    - src/shared/lib/analytics-queries/level-stats.test.ts
    - src/shared/lib/analytics-queries/at-risk-students.test.ts
    - src/shared/lib/student-metrics/load-student-metrics.test.ts
  modified:
    - src/shared/lib/analytics-queries/top-students.ts
    - src/shared/lib/analytics-queries/level-stats.ts
    - src/shared/lib/analytics-queries/at-risk-students.ts
    - src/shared/lib/student-metrics/load-student-metrics.ts
    - src/app/(dashboard)/analytics/page.tsx
    - src/app/api/at-risk-students/route.ts
    - src/app/api/at-risk-students/route.test.ts
    - src/entities/student-metrics/model/types.ts
    - src/entities/student-metrics/api/use-student-metrics.ts
    - src/features/analytics/ui/TopStudents.tsx

key-decisions:
  - "Aggregate top students by studentId within subject scope (one row per student)"
  - "At-risk worst-case: enrollment with max riskFlags, tie-break absencesInMonth"
  - "LevelStats label is String(level.number) only — hasMultipleSubjects removed per D-06"
  - "API teacher filter uses resolveAnalyticsTeacherFilter without ALL_TEACHERS default for TEACHER scoping"

patterns-established:
  - "buildGroupScopeFilter pattern: subjectId + optional groupId/teacherId in Prisma where"
  - "loadStudentRecord loads enrollments in subject scope then filters sessions/completions by groupIds"

requirements-completed: [SUBJ-15]

coverage:
  - id: D1
    description: "getTopStudents requires subjectId and filters sessions/completions by group.subjectId"
    requirement: SUBJ-15
    verification:
      - kind: unit
        ref: "src/shared/lib/analytics-queries/top-students.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "getLevelStats queries levels by subjectId with numeric label only"
    requirement: SUBJ-15
    verification:
      - kind: unit
        ref: "src/shared/lib/analytics-queries/level-stats.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "getAtRiskStudents and loadStudentMetricsForMonth use subject scope with worst-case enrollment"
    requirement: SUBJ-15
    verification:
      - kind: unit
        ref: "src/shared/lib/analytics-queries/at-risk-students.test.ts"
        status: pass
      - kind: unit
        ref: "src/shared/lib/student-metrics/load-student-metrics.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "/analytics renders TopStudents, LevelStatsChart, AtRiskStudentsTable with filterSubjectId"
    requirement: SUBJ-15
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Visual verification of metrics blocks and subject-scoped data requires browser UAT"
  - id: D5
    description: "at-risk API and useAtRiskStudents require subjectId with role-scoped validation"
    requirement: SUBJ-15
    verification:
      - kind: unit
        ref: "src/app/api/at-risk-students/route.test.ts"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-12
status: complete
---

# Phase 14 Plan 02: Subject-Scoped Analytics Queries Summary

**Top, level stats, and at-risk metrics on /analytics filtered by mandatory subjectId with Prisma group.subjectId scope and worst-case enrollment selection**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-11T22:16:00Z
- **Completed:** 2026-07-11T22:24:00Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments
- getTopStudents, getLevelStats, getAtRiskStudents принимают обязательный subjectId и фильтруют данные через Group.subjectId
- loadStudentMetricsForMonth требует scope.subjectId; при нескольких enrollments одного предмета выбирается worst-case
- LevelStats без hasMultipleSubjects — label только номер уровня
- /analytics загружает топ, уровни и at-risk через Promise.all с filterSubjectId
- at-risk API и useAtRiskStudents требуют subjectId с валидацией против role-scoped списка предметов

## Task Commits

Each task was committed atomically:

1. **Task 1: getTopStudents и getLevelStats с subjectId** - `a5d7abf` (feat)
2. **Task 2: getAtRiskStudents и loadStudentMetricsForMonth с subject scope** - `09a8034` (feat)
3. **Task 3: Подключить filterSubjectId на page.tsx и API/hook** - `87e57fc` (feat)

## Files Created/Modified
- `src/shared/lib/analytics-queries/top-students.ts` — subjectId param, group.subjectId Prisma filters
- `src/shared/lib/analytics-queries/level-stats.ts` — subjectId param, removed hasMultipleSubjects
- `src/shared/lib/analytics-queries/at-risk-students.ts` — subjectId param, scope passed to metrics loader
- `src/shared/lib/student-metrics/load-student-metrics.ts` — StudentMetricsScope, worst-case enrollment
- `src/app/(dashboard)/analytics/page.tsx` — wired metrics, removed placeholder Empty
- `src/app/api/at-risk-students/route.ts` — mandatory subjectId with getAnalyticsSubjects validation
- `src/entities/student-metrics/api/use-student-metrics.ts` — useAtRiskStudents requires subjectId
- `src/features/analytics/ui/TopStudents.tsx` — accepts subjectId prop

## Decisions Made
- Агрегация топа по studentId в subject scope (одна строка на ученика)
- Worst-case enrollment для at-risk: max riskFlags, tie-break по absencesInMonth
- LevelStats label = String(level.number) без суффикса предмета (D-06)
- API route: teacherParam без дефолта ALL_TEACHERS — учитель видит только своих учеников

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated loadStudentMetrics call sites outside plan file list**
- **Found during:** Task 2
- **Issue:** Signature change broke journal-actions, student-actions, student-metrics API, risk-flags API
- **Fix:** Pass { subjectId, groupId } from enrollment/group context at each call site
- **Files modified:** journal-actions.ts, student-actions.ts, student-metrics/route.ts, risk-flags/route.ts
- **Committed in:** `09a8034`

**2. [Rule 2 - Security] TEACHER scoping in at-risk API route**
- **Found during:** Task 3
- **Issue:** Old route defaulted missing teacher param to ALL_TEACHERS, exposing all teachers' at-risk data
- **Fix:** Pass teacherParam directly to resolveAnalyticsTeacherFilter (TEACHER defaults to session teacherId)
- **Files modified:** src/app/api/at-risk-students/route.ts
- **Committed in:** Task 3 commit

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Required for tsc and security at trust boundary. No scope creep.

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| TopStudents.tsx | subjectId prop | Accepted for 14-03 StudentStudyHistoryModal subject scope wiring |

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 14-03 can wire subjectId into StudentStudyHistoryModal from TopStudents/AtRiskStudentsTable
- Manual UAT: /analytics?subjectId=... shows metrics only for selected subject; level labels have no subject suffix

## Self-Check: PASSED
- FOUND: src/shared/lib/analytics-queries/top-students.test.ts
- FOUND: src/shared/lib/analytics-queries/level-stats.test.ts
- FOUND: src/shared/lib/analytics-queries/at-risk-students.test.ts
- FOUND: src/shared/lib/student-metrics/load-student-metrics.test.ts
- FOUND: commit a5d7abf
- FOUND: commit 09a8034
- FOUND: commit 87e57fc

---
*Phase: 14-analytics*
*Completed: 2026-07-12*
