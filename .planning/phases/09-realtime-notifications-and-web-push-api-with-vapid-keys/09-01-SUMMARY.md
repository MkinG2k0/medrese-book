---
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
plan: 01
subsystem: database
tags: [prisma, notifications, domain-events, postgresql]

requires:
  - phase: 08-leave-requests
    provides: Domain events LEAVE_REQUEST_* and SUBSTITUTION_ACTIVATED from leave-actions
provides:
  - Notification and PushSubscription Prisma models with migration
  - enqueueNotifications persisting rows inside domain event transactions
  - buildNotificationsForEvent copy/recipient mapping for leave/substitution
  - deliverNotifications post-commit stub for SSE/push in 09-03/09-04
  - dispatchDomainEvent returns created Notification[]
affects:
  - 09-02 (REST API + bell UI)
  - 09-03 (SSE realtime)
  - 09-04 (Web Push)

tech-stack:
  added: []
  patterns:
    - "Transaction-safe enqueue + post-commit deliverNotifications"
    - "Shared notification builder without feature-layer imports"

key-files:
  created:
    - prisma/migrations/20260625070224_notifications_push_subscriptions/migration.sql
    - src/shared/lib/notifications/build-notification.ts
    - src/shared/lib/notifications/enqueue-notifications.ts
    - src/shared/lib/notifications/deliver-notifications.ts
    - src/shared/lib/notifications/build-notification.test.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/domain-events/dispatch.ts
    - src/shared/lib/domain-events/handlers/notifications.ts
    - src/features/leave-requests/actions/leave-actions.ts

key-decisions:
  - "Manager fan-out includes MANAGER and SUPER_ADMIN roles"
  - "Notification copy and type labels live in shared/lib (no @/features imports)"
  - "deliverNotifications is intentional no-op until plans 09-03/09-04"

patterns-established:
  - "Pattern: dispatchDomainEvent returns Notification[] for post-commit delivery"
  - "Pattern: leave-actions void deliverNotifications after $transaction commit"

requirements-completed: [NOTF-04]

duration: 25min
completed: 2026-06-25
---

# Phase 09 Plan 01: Notification Foundation Summary

**Prisma Notification/PushSubscription models with domain-event enqueue and post-commit delivery stub for leave/substitution events**

## Performance

- **Duration:** 25 min
- **Started:** 2026-06-25T09:55:00Z
- **Completed:** 2026-06-25T10:05:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- `Notification` и `PushSubscription` модели в Prisma с миграцией `notifications_push_subscriptions`
- `enqueueNotifications` создаёт строки внутри транзакции domain events; получатели из ролей БД и payload
- `buildNotificationsForEvent` — русские тексты для заявок и замещений; unit-тесты (8 passed)
- `leave-actions` собирает notifications из `dispatchDomainEvent` и вызывает `deliverNotifications` после commit

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma Notification и PushSubscription** - `0c2e145` (feat)
2. **Task 2: build-notification, enqueue, dispatch return, deliver stub** - `17aa3c1` (feat)
3. **Task 3: Миграция Prisma** - `8642633` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — enum NotificationType, модели Notification и PushSubscription
- `prisma/migrations/20260625070224_notifications_push_subscriptions/migration.sql` — DDL
- `src/shared/lib/notifications/build-notification.ts` — маппинг copy/recipients
- `src/shared/lib/notifications/enqueue-notifications.ts` — persist + prisma lookups
- `src/shared/lib/notifications/deliver-notifications.ts` — post-commit stub
- `src/shared/lib/notifications/build-notification.test.ts` — unit-тесты
- `src/shared/lib/domain-events/dispatch.ts` — возвращает Notification[]
- `src/shared/lib/domain-events/handlers/notifications.ts` — re-export enqueue
- `src/features/leave-requests/actions/leave-actions.ts` — post-commit deliver

## Decisions Made

- Копирайт и метки типов отпуска в `shared/lib` (без импорта из `@/features/leave-requests`)
- Fan-out менеджерам включает `SUPER_ADMIN` вместе с `MANAGER`
- `deliverNotifications` — намеренный no-op до SSE (09-03) и Web Push (09-04)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma Json payload typing for createManyAndReturn**
- **Found during:** Task 3 (tsc after generate)
- **Issue:** `Record<string, unknown>` не совместим с `InputJsonValue` в createManyAndReturn
- **Fix:** Cast `draft.payload as Prisma.InputJsonValue`
- **Files modified:** `src/shared/lib/notifications/enqueue-notifications.ts`
- **Verification:** `pnpm exec tsc --noEmit` — нет ошибок в notification-файлах
- **Committed in:** `8642633`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Минимальный — типизация для корректной сборки.

## Known Stubs

| File | Reason |
|------|--------|
| `src/shared/lib/notifications/deliver-notifications.ts` | Intentional no-op; SSE + push в 09-03/09-04 |

## Issues Encountered

- `tsc --noEmit` имеет pre-existing ошибки в `StudentSessionsTable.tsx` и `.next/types/validator.ts` — вне scope плана

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Готово для 09-02: REST API (`GET /api/notifications`), колокольчик, unread count
- PushSubscription schema готова для 09-04
- `deliverNotifications` hook готов для подключения SSE/push

## Self-Check: PASSED

- FOUND: prisma/migrations/20260625070224_notifications_push_subscriptions/migration.sql
- FOUND: src/shared/lib/notifications/build-notification.ts
- FOUND: src/shared/lib/notifications/enqueue-notifications.ts
- FOUND: src/shared/lib/notifications/deliver-notifications.ts
- FOUND: src/shared/lib/notifications/build-notification.test.ts
- FOUND: commit 0c2e145
- FOUND: commit 17aa3c1
- FOUND: commit 8642633

---
*Phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys*
*Completed: 2026-06-25*
