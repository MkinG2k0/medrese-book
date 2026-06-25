---
phase: 08-leave-requests
plan: 04
subsystem: ui
tags: [leave-requests, manager-ui, ant-design, react-hook-form, react-query, substitution, calendar]

requires:
  - phase: 08-02
    provides: approveLeaveRequest, rejectLeaveRequest, useLeaveRequests, getSubstituteTeacherCandidates
  - phase: 08-03
    provides: LeaveCalendar, LeaveDetailModal, leave-labels, expandRequestsByDay
provides:
  - Маршрут /admin/leave-calendar с guard MANAGER/SUPER_ADMIN и пунктом меню
  - ManagerLeaveCalendarPage — календарь всех заявок + фильтруемый грид
  - LeaveRequestsTable с approve/reject для CREATED
  - ApproveLeaveModal с выбором замещающего и RejectLeaveModal с причиной
  - TeacherLeaveRequestsTable, EditLeaveModal и метка «Учитель — Замещение» (post-checkpoint)
affects: [08-05]

tech-stack:
  added: []
  patterns:
    - "LeaveCalendar mode manager — cellRender с фамилией учителя и цветом статуса; REJECTED скрыт"
    - "ApproveLeaveModal/RejectLeaveModal — zodResolver + invalidateQueries leave-requests"
    - "getSubstituteTeacherCandidates — TEACHER users кроме заявителя"
    - "role-labels.ts — formatSubstituteRoleLabel для AppShell и UserSwitcher"

key-files:
  created:
    - src/app/(dashboard)/admin/leave-calendar/page.tsx
    - src/features/leave-requests/ui/ManagerLeaveCalendarPage.tsx
    - src/features/leave-requests/ui/LeaveRequestsTable.tsx
    - src/features/leave-requests/ui/ApproveLeaveModal.tsx
    - src/features/leave-requests/ui/RejectLeaveModal.tsx
    - src/features/leave-requests/ui/TeacherLeaveRequestsTable.tsx
    - src/features/leave-requests/ui/EditLeaveModal.tsx
    - src/features/auth/lib/role-labels.ts
  modified:
    - src/features/leave-requests/actions/leave-actions.ts
    - src/features/leave-requests/ui/LeaveCalendar.tsx
    - src/features/leave-requests/ui/LeaveDetailModal.tsx
    - src/shared/lib/auth.config.ts
    - src/shared/lib/validations/leave-request.ts
    - src/widgets/app-shell/ui/AppShell.tsx
    - src/features/auth/ui/UserSwitcher.tsx
    - src/features/leave-requests/ui/TeacherLeaveCalendarPage.tsx

key-decisions:
  - "Явный roleRoutes ключ /admin/leave-calendar для ясности guard-а"
  - "Post-checkpoint: грид учителя показывает все статусы включая REJECTED; редактирование CREATED/REJECTED"
  - "Метка «Учитель — Замещение» в header и switcher при активном substitution"

patterns-established:
  - "Manager grid: actions только для CREATED; rejected видны при фильтре «Отклонена»"
  - "updateLeaveRequest action для edit/resubmit учителем"

requirements-completed: [LEAV-01, LEAV-03, LEAV-04, TCHR-03]

duration: 45min
completed: 2026-06-25
---

# Phase 08 Plan 04: Календарь и грид менеджера Summary

**Маршрут /admin/leave-calendar: календарь заявок с цветовой кодировкой, грид с фильтрами, подтверждение с замещающим и отклонение с обязательной причиной**

## Performance

- **Duration:** 45 min (включая human-verify checkpoint)
- **Started:** 2026-06-24T23:56:25Z
- **Completed:** 2026-06-25T00:07:30Z
- **Tasks:** 4
- **Files modified:** 16

## Accomplishments

- Менеджер открывает «Календарь отпусков» из sidebar; CREATED — серые badges, APPROVED — зелёные; REJECTED скрыты на календаре
- LeaveRequestsTable под календарём: фильтры по статусу/учителю/типу/периоду, пагинация 20, сортировка createdAt desc
- Подтверждение через ApproveLeaveModal с обязательным выбором замещающего; success message «Заявка подтверждена, замещение активировано»
- Отклонение через RejectLeaveModal с TextArea min 5 символов; причина видна в гриде при фильтре «Отклонена»
- Human-verify одобрен; по feedback добавлены грид учителя, edit/resubmit и метка замещения

## Task Commits

1. **Task 1: Route /admin/leave-calendar и навигация** - `04c7f2e` (feat)
2. **Task 2: Manager calendar + LeaveRequestsTable** - `b97e239` (feat)
3. **Task 3: ApproveLeaveModal и RejectLeaveModal** - `077a084` (feat)
4. **Task 4: Проверка manager flow в браузере** - approved (human-verify checkpoint, без отдельного commit)

**Post-checkpoint fix (user feedback):** `4d311ef` (fix)

## Files Created/Modified

- `src/app/(dashboard)/admin/leave-calendar/page.tsx` — requireRoles MANAGER/SUPER_ADMIN
- `src/widgets/app-shell/ui/AppShell.tsx` — пункт «Календарь отпусков», метка замещения в header
- `src/features/leave-requests/ui/ManagerLeaveCalendarPage.tsx` — layout календарь + таблица + modals
- `src/features/leave-requests/ui/LeaveRequestsTable.tsx` — грид менеджера с фильтрами и actions
- `src/features/leave-requests/ui/ApproveLeaveModal.tsx` — выбор substituteTeacherId
- `src/features/leave-requests/ui/RejectLeaveModal.tsx` — rejectionReason min 5
- `src/features/leave-requests/actions/leave-actions.ts` — getSubstituteTeacherCandidates, updateLeaveRequest
- `src/features/leave-requests/ui/TeacherLeaveRequestsTable.tsx` — грид всех заявок учителя
- `src/features/leave-requests/ui/EditLeaveModal.tsx` — редактирование CREATED/REJECTED
- `src/features/auth/lib/role-labels.ts` — formatSubstituteRoleLabel

## Decisions Made

- Reuse LeaveCalendar с mode manager вместо отдельного компонента
- Post-checkpoint: teacher grid показывает rejected (в отличие от календаря); edit/resubmit для CREATED и REJECTED
- «Учитель — Замещение» в AppShell title и UserSwitcher при active substitution session

## Deviations from Plan

### Post-checkpoint user feedback (commit 4d311ef)

**1. Teacher grid, edit/resubmit, substitution label**
- **Found during:** Task 4 (human-verify checkpoint)
- **Issue:** Пользователь запросил: грид учителя со всеми заявками включая rejected; редактирование CREATED/REJECTED; метка «Учитель — Замещение» в header и switcher
- **Fix:** TeacherLeaveRequestsTable, EditLeaveModal, updateLeaveRequest, role-labels + AppShell/UserSwitcher updates
- **Files modified:** см. commit 4d311ef
- **Verification:** User approved after fix
- **Committed in:** `4d311ef`

---

**Total deviations:** 1 (post-checkpoint scope extension per user feedback)
**Impact on plan:** Не блокирует manager flow; улучшает teacher UX и substitution visibility. В scope plan 08-04 manager deliverables выполнены полностью.

## Issues Encountered

None — manager flow прошёл human-verify; feedback реализован в отдельном fix commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Manager workflow (LEAV-01, LEAV-03, LEAV-04, TCHR-03) готов для E2E в plan 08-05
- Approve/reject modals wired к server actions с invalidateQueries
- Teacher edit/resubmit доступен для smoke-тестов E2E

---
*Phase: 08-leave-requests*
*Completed: 2026-06-25*

## Self-Check: PASSED

- FOUND: `.planning/phases/08-leave-requests/08-04-SUMMARY.md`
- FOUND: commit `04c7f2e`
- FOUND: commit `b97e239`
- FOUND: commit `077a084`
- FOUND: commit `4d311ef`
