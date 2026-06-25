---
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
plan: 03
subsystem: api
tags: [notifications, sse, event-source, react-query, playwright, middleware]

requires:
  - phase: 09-02
    provides: NotificationBell, React Query hooks, REST API
provides:
  - GET /api/notifications/stream SSE with session auth and DB poll
  - useNotificationStream hook with reconnect and cache invalidation
  - middleware exclusion for sw.js (prep for Web Push)
  - E2E realtime badge update without page reload
affects:
  - 09-04 (Web Push + service worker registration)
  - 09-05 (broader notification E2E)

tech-stack:
  added: []
  patterns:
    - "SSE ReadableStream on Node.js runtime with 2s DB poll + 30s heartbeat"
    - "EventSource in useNotificationStream invalidates notifications + unread-count"
    - "middleware negative lookahead includes sw.js for public SW asset"

key-files:
  created:
    - src/app/api/notifications/stream/route.ts
    - src/entities/notification/api/use-notification-stream.ts
    - e2e/notifications-realtime.spec.ts
  modified:
    - src/entities/notification/index.ts
    - src/features/notifications/ui/NotificationBell.tsx
    - middleware.ts
    - playwright.config.ts

key-decisions:
  - "SSE userId только из session.user.id — без query param (T-9-08/09)"
  - "Reconnect до 3 попыток с 5s delay при onerror EventSource"
  - "E2E: два browser context — manager ждёт SSE, teacher создаёт заявку"

patterns-established:
  - "Pattern: SSE payload { type: 'notification', id } → invalidateQueries"
  - "Pattern: badge poll сравнивает count до/после без page.reload()"

requirements-completed: [NOTF-05]

duration: 45min
completed: 2026-06-25
---

# Phase 09 Plan 03: SSE Realtime Notifications Summary

**SSE stream на Node.js с DB-poll и EventSource hook — badge обновляется без перезагрузки страницы (NOTF-05)**

## Performance

- **Duration:** 45 min
- **Started:** 2026-06-25T08:00:00Z
- **Completed:** 2026-06-25T08:45:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `GET /api/notifications/stream` — авторизованный SSE с poll 2s, heartbeat 30s, abort cleanup
- `useNotificationStream` в NotificationBell — invalidate React Query при новом уведомлении
- `middleware.ts` исключает `sw.js` из auth matcher (подготовка к 09-04)
- E2E подтверждает рост badge менеджера за ≤10s без reload при заявке учителя

## Task Commits

Each task was committed atomically:

1. **Task 1: SSE route GET /api/notifications/stream** - `adfa48d` (feat)
2. **Task 2: useNotificationStream + wire в NotificationBell** - `74b6af8` (feat)
3. **Task 3: E2E realtime badge update** - `cbea0b7` (test)

## Files Created/Modified

- `src/app/api/notifications/stream/route.ts` — ReadableStream SSE, prisma poll, heartbeat
- `src/entities/notification/api/use-notification-stream.ts` — EventSource + reconnect
- `src/entities/notification/index.ts` — export useNotificationStream
- `src/features/notifications/ui/NotificationBell.tsx` — вызов useNotificationStream()
- `middleware.ts` — `(?!...|sw\.js)` в matcher
- `e2e/notifications-realtime.spec.ts` — serial E2E, два context, badge poll
- `playwright.config.ts` — webServer timeout 120s, health URL /login, PLAYWRIGHT_NO_WEBSERVER

## Decisions Made

- userId для SSE только из `session.user.id` (mitigate T-9-08, T-9-09)
- Reconnect EventSource: max 3 retries, 5s delay, без console.log
- E2E сравнивает badge count до/после (устойчиво при уже непрочитанных уведомлениях)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright webServer не стартует локально**
- **Found during:** Task 3 (E2E verify)
- **Issue:** `.next/dev/lock` при параллельном `next dev`; reuseExistingServer на Windows не срабатывает; timeout 10s недостаточен
- **Fix:** `PLAYWRIGHT_NO_WEBSERVER=1` для внешнего сервера; timeout 120s; health check на `/login`
- **Files modified:** `playwright.config.ts`
- **Verification:** `pnpm test:e2e e2e/notifications-realtime.spec.ts` — 7 passed
- **Committed in:** `cbea0b7`

**2. [Rule 1 - Bug] Лишняя E2E-проверка строки таблицы**
- **Found during:** Task 3 (первый прогон E2E)
- **Issue:** Badge обновился, но assert row в grid падал (таблица не realtime)
- **Fix:** Убрана проверка row — scope теста только badge без reload
- **Files modified:** `e2e/notifications-realtime.spec.ts`
- **Verification:** E2E green после правки
- **Committed in:** `cbea0b7`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Минимальный — улучшение playwright config и фокус E2E на NOTF-05.

## Issues Encountered

- ESLint ignore для `src/app/api/**` — lint verify из плана даёт warning (как в 09-02)
- Локальный E2E требует свободный порт 3005 или `PLAYWRIGHT_NO_WEBSERVER=1` с заранее запущенным dev

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Готово для 09-04: `sw.js` не блокируется middleware; SSE уже доставляет in-app realtime
- Web Push может использовать тот же invalidate pattern после push event
- `useUnreadCount` refetchInterval 60s остаётся fallback при disconnect SSE

## Self-Check: PASSED

- FOUND: src/app/api/notifications/stream/route.ts
- FOUND: src/entities/notification/api/use-notification-stream.ts
- FOUND: e2e/notifications-realtime.spec.ts
- FOUND: commit adfa48d
- FOUND: commit 74b6af8
- FOUND: commit cbea0b7

---
*Phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys*
*Completed: 2026-06-25*
