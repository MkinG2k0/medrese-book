---
phase: 15-student-portal-extra-assignments
plan: 02
subsystem: ui
tags: [nextjs, student-portal, groupId, enrollment, localStorage]

requires:
  - phase: 15-student-portal-extra-assignments
    provides: student-portal query/storage helpers и enrollment dashboard (plan 15-01)
  - phase: 12-progress-sessions
    provides: sessions scoped by groupId, subject-scoped offsets
provides:
  - resolveStudentEnrollment и getStudentEnrollmentGroupIds в student-actions
  - getStudentLessons/getStudentSessionHistory с optional groupId
  - страницы lessons/history с resolveStudentGroupId из URL
  - StudentPortalGroupLink и deep links с карточек enrollment
affects:
  - 15-04 (student extra assignment history в портале)

tech-stack:
  added: []
  patterns:
    - "URL param groupId > primary enrollment fallback на server (D-08)"
    - "localStorage lastGroupId при клике с карточки (D-07)"
    - "sessions.findMany where groupId = enrollment.groupId"

key-files:
  created:
    - src/features/student-portal/ui/StudentPortalGroupLink.tsx
  modified:
    - src/features/student-portal/actions/student-actions.ts
    - src/app/(dashboard)/student/lessons/page.tsx
    - src/app/(dashboard)/student/history/page.tsx
    - src/features/student-portal/ui/StudentEnrollmentCard.tsx

key-decisions:
  - "Приоритет контекста: URL param > primary enrollment; storage только при клике с карточки"
  - "StudentPortalMenuSync не добавлен — server-side resolve достаточен для D-08"
  - "getStudentProfile/getStudentPeriodMetrics удалены как неиспользуемые после dashboard 15-01"

patterns-established:
  - "Student portal deep link: buildStudentPortalHref + StudentPortalGroupLink + writeStudentPortalGroupId"

requirements-completed: [SUBJ-16]

coverage:
  - id: D1
    description: Server actions getStudentLessons/getStudentSessionHistory scoped by enrollment groupId
    requirement: SUBJ-16
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: false
  - id: D2
    description: Страницы /student/lessons и /student/history резолвят groupId из URL с fallback на primary
    requirement: SUBJ-16
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit
        status: pass
    human_judgment: false
  - id: D3
    description: Deep links «Уроки»/«История» на карточках enrollment с groupId в href и localStorage
    requirement: SUBJ-16
    verification:
      - kind: other
        ref: pnpm exec tsc --noEmit && rg AppShell student nav
        status: pass
    human_judgment: true
    rationale: Проверка F5 сохранения контекста и клика с карточки требует ручного UAT в браузере

duration: 12min
completed: 2026-07-12
status: complete
---

# Phase 15 Plan 02: Student Portal groupId Navigation Summary

**Навигация ученика с groupId в URL: scoped lessons/history, deep links с карточек, primary enrollment fallback**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-11T22:58:00Z
- **Completed:** 2026-07-11T23:10:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `resolveStudentEnrollment` и `getStudentEnrollmentGroupIds` — scoped данные по зачислению
- Страницы lessons/history читают `?groupId=` с fallback на primary enrollment (D-08)
- `StudentPortalGroupLink` на карточках дашборда — deep links с записью lastGroupId (D-05, D-07)
- Пункты меню «Уроки» и «История занятий» в AppShell без изменений (D-06)

## Task Commits

Each task was committed atomically:

1. **Task 1: Server actions с groupId scope** - `ae3f1b1` (feat)
2. **Task 2: Страницы lessons и history с groupId в URL** - `b41bc67` (feat)
3. **Task 3: Deep links с карточек и localStorage** - `e0e1b72` (feat)

## Files Created/Modified

- `src/features/student-portal/actions/student-actions.ts` — resolveStudentEnrollment, scoped lessons/history, getStudentEnrollmentGroupIds
- `src/app/(dashboard)/student/lessons/page.tsx` — searchParams + resolveStudentGroupId
- `src/app/(dashboard)/student/history/page.tsx` — searchParams + resolveStudentGroupId
- `src/features/student-portal/ui/StudentPortalGroupLink.tsx` — client link с writeStudentPortalGroupId
- `src/features/student-portal/ui/StudentEnrollmentCard.tsx` — кнопки «Уроки» и «История»

## Decisions Made

- Storage не переопределяет URL и primary default — только запись при клике с карточки
- Удалены неиспользуемые getStudentProfile/getStudentPeriodMetrics

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 15-04 может опираться на groupId navigation для истории допзаданий в портале
- Ручной UAT: клик «Уроки» с карточки → URL с groupId; F5; меню без param → primary

---
*Phase: 15-student-portal-extra-assignments*
*Completed: 2026-07-12*

## Self-Check: PASSED

- FOUND: src/features/student-portal/ui/StudentPortalGroupLink.tsx
- FOUND: src/app/(dashboard)/student/lessons/page.tsx
- FOUND: src/app/(dashboard)/student/history/page.tsx
- FOUND: ae3f1b1
- FOUND: b41bc67
- FOUND: e0e1b72
