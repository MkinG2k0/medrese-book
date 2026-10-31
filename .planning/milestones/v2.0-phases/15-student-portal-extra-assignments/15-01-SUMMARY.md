---
phase: 15-student-portal-extra-assignments
plan: 01
subsystem: ui
tags: [nextjs, prisma, student-portal, enrollment, vitest, ant-design]

requires:
  - phase: 12-progress-sessions
    provides: прогресс per GroupEnrollment, subject-scoped offsets
  - phase: 14-analytics
    provides: StudentMetricsCards, loadStudentMetricsForMonth с subjectId/groupId
provides:
  - URL/query helpers groupId для портала ученика (D-07)
  - getStudentEnrollmentDashboard server action
  - StudentEnrollmentCard и дашборд /student/me с карточками per enrollment
affects:
  - 15-02 (lessons/history с groupId из карточек)
  - 15-03/04 (extra assignments в портале)

tech-stack:
  added: []
  patterns:
    - "buildStudentPortalHref / resolveStudentGroupId — паттерн journal/analytics URL"
    - "Promise.all per enrollment для subject-scoped metrics и totalSteps"

key-files:
  created:
    - src/features/student-portal/lib/student-portal-query.ts
    - src/features/student-portal/lib/student-portal-query.test.ts
    - src/features/student-portal/lib/student-portal-storage.ts
    - src/features/student-portal/ui/StudentEnrollmentCard.tsx
  modified:
    - src/features/student-portal/actions/student-actions.ts
    - src/app/(dashboard)/student/me/page.tsx

key-decisions:
  - "Одна карточка на GroupEnrollment с subject-scoped прогрессом и метриками месяца (D-01–D-04)"
  - "getStudentProfile/getStudentLessons сохранены с fix subjectId; dashboard заменяет их только на /student/me"
  - "Ссылки на lessons/history отложены до plan 15-02"

patterns-established:
  - "Student portal groupId: query param + localStorage key student-portal:lastGroupId"
  - "Enrollment dashboard: getStudentEnrollmentDashboard → N × StudentEnrollmentCard"

requirements-completed: [SUBJ-16]

coverage:
  - id: D1
    description: URL/query слой groupId для портала (buildStudentPortalHref, resolveStudentGroupId, storage)
    requirement: SUBJ-16
    verification:
      - kind: unit
        ref: src/features/student-portal/lib/student-portal-query.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: getStudentEnrollmentDashboard возвращает данные всех зачислений с subject-scoped totalSteps и periodMetrics
    requirement: SUBJ-16
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: false
  - id: D3
    description: /student/me рендерит карточку на каждое зачисление с прогрессом и метриками месяца
    requirement: SUBJ-16
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: true
    rationale: Визуальная проверка карточек и метрик на реальных данных ученика требует ручного UAT

duration: 8min
completed: 2026-07-11
status: complete
---

# Phase 15 Plan 01: Enrollment Dashboard Summary

**Дашборд `/student/me` с карточками per GroupEnrollment, subject-scoped прогрессом и метриками месяца**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-11T22:51:00Z
- **Completed:** 2026-07-11T22:59:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- URL/query helpers `groupId` для портала ученика (паттерн journal, D-07)
- `getStudentEnrollmentDashboard` — параллельная загрузка totalSteps и periodMetrics per enrollment
- `StudentEnrollmentCard` и обновлённая `/student/me` — N карточек для N зачислений (D-01, D-02)

## Task Commits

Each task was committed atomically:

1. **Task 1: student-portal query и storage helpers** - `f067d23` (feat)
2. **Task 2: getStudentEnrollmentDashboard server action** - `ce7bc13` (feat)
3. **Task 3: StudentEnrollmentCard и дашборд /student/me** - `724a936` (feat)

## Files Created/Modified

- `src/features/student-portal/lib/student-portal-query.ts` — STUDENT_PORTAL_GROUP_PARAM, buildStudentPortalHref, resolveStudentGroupId
- `src/features/student-portal/lib/student-portal-query.test.ts` — vitest для URL/query resolution
- `src/features/student-portal/lib/student-portal-storage.ts` — localStorage lastGroupId
- `src/features/student-portal/actions/student-actions.ts` — getStudentEnrollmentDashboard + subjectId fixes
- `src/features/student-portal/ui/StudentEnrollmentCard.tsx` — карточка зачисления
- `src/app/(dashboard)/student/me/page.tsx` — дашборд вместо одиночного прогресс-бара

## Decisions Made

- Dashboard использует только enrollments из сессии STUDENT; legacy actions сохранены для lessons/history до 15-02
- Fallback periodMetrics с нулями при отсутствии metricsResult — без падения карточки

## Deviations from Plan

### TDD Gate Compliance

Task 1 имел `tdd="true"`, но RED/GREEN коммиты объединены в один feat-коммит — тесты и реализация добавлены в одной итерации (6/6 pass).

### Auto-fixed Issues

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 15-02 может подключить ссылки с карточек на `/student/lessons?groupId=` и history
- Query/storage helpers готовы для groupId resolution на страницах уроков и истории

---
*Phase: 15-student-portal-extra-assignments*
*Completed: 2026-07-11*

## Self-Check: PASSED

- FOUND: src/features/student-portal/lib/student-portal-query.ts
- FOUND: src/features/student-portal/lib/student-portal-query.test.ts
- FOUND: src/features/student-portal/lib/student-portal-storage.ts
- FOUND: src/features/student-portal/ui/StudentEnrollmentCard.tsx
- FOUND: f067d23
- FOUND: ce7bc13
- FOUND: 724a936
