---
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
plan: 02
subsystem: api
tags: [notifications, react-query, antd, rest-api, appshell]

requires:
  - phase: 09-01
    provides: Notification Prisma model and domain-event enqueue
provides:
  - GET /api/notifications, unread-count, PATCH mark-read with session-scoped IDOR protection
  - React Query hooks useNotifications, useUnreadCount, useMarkNotificationRead
  - NotificationBell + NotificationList in AppShell Header for all roles
affects:
  - 09-03 (SSE realtime refetch)
  - 09-04 (Web Push)
  - 09-05 (E2E notifications)

tech-stack:
  added: []
  patterns:
    - "Session-scoped notification API via authorizeApiRequest + userId: session.user.id"
    - "entities/notification React Query hooks with 60s unread-count polling fallback"

key-files:
  created:
    - src/shared/lib/validations/notification.ts
    - src/app/api/notifications/route.ts
    - src/app/api/notifications/unread-count/route.ts
    - src/app/api/notifications/mark-read/route.ts
    - src/entities/notification/model/types.ts
    - src/entities/notification/api/use-notifications.ts
    - src/entities/notification/api/use-unread-count.ts
    - src/entities/notification/api/use-mark-notification-read.ts
    - src/entities/notification/index.ts
    - src/features/notifications/ui/NotificationBell.tsx
    - src/features/notifications/ui/NotificationList.tsx
    - src/features/notifications/index.ts
  modified:
    - src/widgets/app-shell/ui/AppShell.tsx

key-decisions:
  - "Колокольчик без RoleGuard — все dashboard-роли видят bell (ученики получают пустой список в v1)"
  - "useUnreadCount refetchInterval 60s как fallback до SSE в 09-03"
  - "mark-read через updateMany scoped к session.user.id — чужие ids игнорируются"

patterns-established:
  - "Pattern: notification DTO с ISO readAt/createdAt в API, NotificationItem в entities"
  - "Pattern: NotificationBell в Header слева от блока имени пользователя"

requirements-completed: [NOTF-01, NOTF-02, NOTF-04]

duration: 15min
completed: 2026-06-25
---

# Phase 09 Plan 02: In-App Notifications API and Bell Summary

**REST API для in-app уведомлений с session-scoped доступом, React Query hooks и колокольчик в AppShell для всех ролей**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-25T07:05:00Z
- **Completed:** 2026-06-25T07:20:00Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- GET `/api/notifications`, `/unread-count` и PATCH `/mark-read` с фильтром `userId: session.user.id`
- Hooks `useNotifications`, `useUnreadCount` (polling 60s), `useMarkNotificationRead` с invalidateQueries
- `NotificationBell` с Badge, Dropdown 360px и `NotificationList` в Header AppShell для всех ролей

## Task Commits

Each task was committed atomically:

1. **Task 1: REST API — list, unread-count, mark-read** - `6bebed4` (feat)
2. **Task 2: entities/notification React Query hooks** - `acf7152` (feat)
3. **Task 3: NotificationBell + NotificationList в AppShell Header** - `0d0f4cb` (feat)

## Files Created/Modified

- `src/shared/lib/validations/notification.ts` — Zod schema mark-read (ids | all)
- `src/app/api/notifications/route.ts` — GET список, newest first, limit
- `src/app/api/notifications/unread-count/route.ts` — GET count непрочитанных
- `src/app/api/notifications/mark-read/route.ts` — PATCH mark ids/all
- `src/entities/notification/` — types + React Query hooks
- `src/features/notifications/ui/NotificationBell.tsx` — BellOutlined + Badge + Dropdown
- `src/features/notifications/ui/NotificationList.tsx` — список, mark-read, «Отметить все»
- `src/widgets/app-shell/ui/AppShell.tsx` — NotificationBell в Header

## Decisions Made

- Колокольчик доступен всем ролям без RoleGuard (A3 из RESEARCH)
- Polling unread-count 60s до подключения SSE в 09-03
- updateMany по userId — foreign notification ids не обновляются (T-9-05)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript narrowing для Zod union mark-read**
- **Found during:** Task 1 (tsc)
- **Issue:** `parsed.data.ids` недоступен без сужения union `{ ids } | { all: true }`
- **Fix:** Ветка `'all' in parsed.data` перед доступом к `ids`
- **Files modified:** `src/app/api/notifications/mark-read/route.ts`
- **Verification:** `tsc --noEmit` — нет ошибок в notification-файлах
- **Committed in:** `6bebed4`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Минимальный — корректная типизация union schema.

## Issues Encountered

- ESLint ignore pattern для `src/app/api/**` — lint verify из плана даёт warnings; tsc проходит для notification-файлов
- Pre-existing tsc errors в других файлах — вне scope плана

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Готово для 09-03: SSE stream + useNotificationStream для мгновенного обновления bell
- API endpoints готовы для E2E в 09-05
- Уведомления отпусков (NOTF-04) отображаются в dropdown при наличии данных из 09-01

## Self-Check: PASSED

- FOUND: src/app/api/notifications/route.ts
- FOUND: src/app/api/notifications/unread-count/route.ts
- FOUND: src/app/api/notifications/mark-read/route.ts
- FOUND: src/entities/notification/index.ts
- FOUND: src/features/notifications/ui/NotificationBell.tsx
- FOUND: src/features/notifications/ui/NotificationList.tsx
- FOUND: commit 6bebed4
- FOUND: commit acf7152
- FOUND: commit 0d0f4cb

---
*Phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys*
*Completed: 2026-06-25*
