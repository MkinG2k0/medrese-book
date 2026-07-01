---
phase: 01-student-analytics-history
plan: 03
subsystem: ui
tags: [journal, at-risk, teaching-session, antd, student-metrics]

requires:
  - phase: 01-student-analytics-history
    provides: student-metrics API and hooks from plan 01-02
provides:
  - JournalRiskBadge and batch risk flags in journal table
  - NormWarningAlert on lesson page for TIME_NORM
  - StudentMetricsCards compact variant in lesson header
  - D-04 actualTimeSource default teaching_session with unit tests
affects:
  - 01-student-analytics-history plan 01-04 (portal StudentMetricsCards)
  - analytics AtRiskStudentsTable

tech-stack:
  added: []
  patterns:
    - showRiskBadge gated by useSession TEACHER/MANAGER
    - getStudentLesson loads loadStudentMetricsForMonth server-side
    - StudentMetricsCards variant compact | portal

key-files:
  created:
    - src/features/journal/ui/JournalRiskBadge.tsx
    - src/features/journal/ui/NormWarningAlert.tsx
    - src/features/analytics/ui/StudentMetricsCards.tsx
  modified:
    - src/shared/lib/student-metrics/at-risk-config.ts
    - src/features/journal/ui/LessonTimerBar.tsx
    - src/features/journal/ui/StudentList.tsx
    - src/features/journal/ui/JournalStudentsTable.tsx
    - src/features/journal/actions/journal-actions.ts
    - src/features/journal/ui/LessonPage.tsx
    - src/features/journal/ui/lesson/LessonPageHeader.tsx

key-decisions:
  - "D-04: actualTimeSource по умолчанию teaching_session после верификации таймера"
  - "Badge без stopPropagation — клик по строке не блокируется"
  - "При loading risk flags badge не показывается (без Spin на ячейку)"

patterns-established:
  - "JournalRiskBadge: semantic antd Tag+Tooltip only, aria-label per UI-SPEC"
  - "Lesson metrics через getStudentLesson + loadStudentMetricsForMonth"

requirements-completed: [ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07]

coverage:
  - id: D1
    description: "Teaching session timer ANLY-01/02 и D-04 teaching_session"
    requirement: ANLY-01
    verification:
      - kind: unit
        ref: "pnpm test:unit -- src/features/journal/lib/teaching-session.test.ts src/shared/lib/student-metrics/period-metrics.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "JournalRiskBadge в колонке ученика для TEACHER/MANAGER"
    requirement: ANLY-06
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Визуальная проверка badge в журнале не автоматизирована в этом плане"
  - id: D3
    description: "NormWarningAlert и compact StudentMetricsCards на странице урока"
    requirement: ANLY-07
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Размещение Alert и Statistic требует ручной проверки UI"

duration: 25min
completed: 2026-07-01
status: complete
---

# Phase 01 Plan 03: Journal UX Summary

**Таймер урока на teaching_session, badge отставания в журнале и предупреждение о нормативе на странице урока**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-01T19:28:00Z
- **Completed:** 2026-07-01T19:53:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Верифицирован flow ANLY-01/02; `actualTimeSource` переключён на `teaching_session` (D-04)
- `JournalRiskBadge` + batch `useStudentRiskFlags` в `StudentList`/`JournalStudentsTable`
- `NormWarningAlert` и compact `StudentMetricsCards` на странице урока учителя
- `getStudentLesson` возвращает `riskFlags` и `periodMetrics` за текущий месяц

## Task Commits

Each task was committed atomically:

1. **Task 1: Верификация ANLY-01/02 teaching session** - `457ce21` (feat)
2. **Task 2: JournalRiskBadge и batch risk flags в журнале** - `d30e756` (feat)
3. **Task 3: NormWarningAlert и метрики в шапке урока** - `35afc69` (feat)

## Files Created/Modified

- `src/features/journal/ui/JournalRiskBadge.tsx` — Tag+Tooltip по UI-SPEC
- `src/features/journal/ui/NormWarningAlert.tsx` — Alert type=warning над шагами
- `src/features/analytics/ui/StudentMetricsCards.tsx` — variant compact | portal
- `src/shared/lib/student-metrics/at-risk-config.ts` — default teaching_session
- `src/features/journal/ui/StudentList.tsx` — useStudentRiskFlags + showRiskBadge
- `src/features/journal/actions/journal-actions.ts` — metrics в getStudentLesson

## Decisions Made

- D-04 миграция на teaching_session после подтверждения unit-тестов таймера
- Badge скрыт при loading risk flags (без per-cell Spin)
- Ошибки таймера — фиксированный copy из UI-SPEC, не message из API

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth | src/features/journal/ui/StudentList.tsx | showRiskBadge только TEACHER/MANAGER |

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Journal UX готов для 01-04 (AtRiskStudentsTable, portal StudentMetricsCards)
- `StudentMetricsCards` variant portal готов для `/student/me`

## Self-Check: PASSED

- FOUND: src/features/journal/ui/JournalRiskBadge.tsx
- FOUND: src/features/journal/ui/NormWarningAlert.tsx
- FOUND: src/features/analytics/ui/StudentMetricsCards.tsx
- FOUND: 457ce21, d30e756, 35afc69

---
*Phase: 01-student-analytics-history*
*Completed: 2026-07-01*
