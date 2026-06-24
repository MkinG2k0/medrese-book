---
phase: 08-leave-requests
plan: 03
subsystem: ui
tags: [leave-requests, calendar, ant-design, react-hook-form, react-query, teacher-ui]

requires:
  - phase: 08-02
    provides: createLeaveRequest action, useLeaveRequests hook, leave-labels
provides:
  - Маршрут /calendar с guard TEACHER и пунктом меню
  - LeaveCalendar с badges по статусу и легендой
  - CreateLeaveModal для VACATION / DAY_OFF / SICK_LEAVE
  - LeaveDetailModal read-only для учителя
affects: [08-04, 08-05]

tech-stack:
  added: []
  patterns:
    - "Badge календаря — div/span Tailwind в cellRender, не antd Tag"
    - "CreateLeaveModal — client zod schema + map в ISO для server action"
    - "destroyOnHidden на Modal (antd 6, как в остальном проекте)"

key-files:
  created:
    - src/app/(dashboard)/calendar/page.tsx
    - src/features/leave-requests/ui/TeacherLeaveCalendarPage.tsx
    - src/features/leave-requests/ui/LeaveCalendar.tsx
    - src/features/leave-requests/ui/CreateLeaveModal.tsx
    - src/features/leave-requests/ui/LeaveDetailModal.tsx
  modified:
    - src/shared/lib/auth.config.ts
    - src/widgets/app-shell/ui/AppShell.tsx

key-decisions:
  - "destroyOnHidden вместо destroyOnClose — соответствует antd 6 и существующим модалкам проекта"
  - "Client form schema отдельно от createLeaveRequestSchema — RangePicker возвращает Dayjs, type передаётся prop"

patterns-established:
  - "expandRequestsByDay — развёртка диапазона заявок по дням через date-fns eachDayOfInterval"
  - "REJECTED заявки скрыты на календаре, но видны в LeaveDetailModal при клике из других контекстов"

requirements-completed: [LEAV-02, LEAV-05]

duration: 30min
completed: 2026-06-25
---

# Phase 08 Plan 03: Календарь учителя Summary

**Страница /calendar: Ant Design Calendar с badges заявок, три типа создания (отпуск/отгул/больничный) и read-only детали**

## Performance

- **Duration:** 30 min
- **Started:** 2026-06-25T01:10:00Z
- **Completed:** 2026-06-25T01:40:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Преподаватель открывает `/calendar` из меню «Календарь» (только TEACHER)
- Календарь показывает CREATED/APPROVED заявки с цветными badges; REJECTED скрыты на сетке
- Три primary-кнопки открывают CreateLeaveModal с корректным типом и заголовком
- После отправки — `message.success` и invalidate `['leave-requests']`
- Клик по badge открывает LeaveDetailModal с причиной отклонения для REJECTED

## Task Commits

1. **Task 1: Route, guard и навигация** - `7ca7fc1` (feat)
2. **Task 2: LeaveCalendar с badges и легендой** - `128ffbc` (feat)
3. **Task 3: CreateLeaveModal и LeaveDetailModal** - `dd39709` (feat)

## Files Created/Modified

- `src/app/(dashboard)/calendar/page.tsx` — requireRole TEACHER, делегирует в client page
- `src/shared/lib/auth.config.ts` — roleRoutes `/calendar`: TEACHER
- `src/widgets/app-shell/ui/AppShell.tsx` — пункт «Календарь» после «Моя группа»
- `src/features/leave-requests/ui/TeacherLeaveCalendarPage.tsx` — layout, toolbar, data fetch, modals
- `src/features/leave-requests/ui/LeaveCalendar.tsx` — month calendar, cellRender badges, legend, empty/loading
- `src/features/leave-requests/ui/CreateLeaveModal.tsx` — форма RangePicker + описание, createLeaveRequest
- `src/features/leave-requests/ui/LeaveDetailModal.tsx` — read-only Descriptions для учителя

## Decisions Made

- Client-side zod schema для формы с Dayjs tuple; type заявки передаётся prop, не через форму
- `destroyOnHidden` на Modal — паттерн antd 6 в проекте (GroupsList, UsersTable и др.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Минимальный TeacherLeaveCalendarPage в Task 1**
- **Found during:** Task 1 (page.tsx import)
- **Issue:** page.tsx импортирует TeacherLeaveCalendarPage, файл создаётся в Task 2
- **Fix:** Создан stub-компонент в Task 1, расширен в Task 2
- **Files modified:** src/features/leave-requests/ui/TeacherLeaveCalendarPage.tsx
- **Verification:** lint passed, page compiles
- **Committed in:** 7ca7fc1

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Необходимо для компиляции маршрута. Семантика плана сохранена.

## Issues Encountered

- ESLint игнорирует файлы в `(dashboard)` route group — verify через `--no-warn-ignored` на соседних файлах

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Teacher UX (LEAV-02, LEAV-05) готов для E2E smoke в plan 08-05
- Plan 08-04 может строить manager calendar/grid на тех же lib/labels и entities hook

---
*Phase: 08-leave-requests*
*Completed: 2026-06-25*

## Self-Check: PASSED

- FOUND: src/app/(dashboard)/calendar/page.tsx
- FOUND: src/features/leave-requests/ui/LeaveCalendar.tsx
- FOUND: src/features/leave-requests/ui/CreateLeaveModal.tsx
- FOUND: commit 7ca7fc1
- FOUND: commit 128ffbc
- FOUND: commit dd39709
