---
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
plan: 04
subsystem: api
tags: [notifications, web-push, vapid, service-worker, push-subscription]

requires:
  - phase: 09-03
    provides: SSE realtime, middleware sw.js exclusion, NotificationBell
provides:
  - web-push@3.6.7 with VAPID env config
  - public/sw.js push + notificationclick handlers
  - POST/DELETE /api/push/subscribe with session-bound upsert
  - sendPushToUser with 410 stale cleanup
  - deliverNotifications post-commit Web Push delivery
  - PushSubscribePrompt opt-in UX in NotificationBell dropdown
affects:
  - 09-05 (E2E push tests, send-push unit tests)

tech-stack:
  added: [web-push@3.6.7, @types/web-push]
  patterns:
    - "Lazy ensureVapidConfigured before send; private key server-only"
    - "deliverNotifications → Promise.allSettled sendPushToUser per notification"
    - "PushSubscribePrompt: permission default + localStorage dismiss/denied"

key-files:
  created:
    - public/sw.js
    - src/shared/lib/push/vapid.ts
    - src/shared/lib/push/send-push.ts
    - src/shared/lib/validations/push-subscription.ts
    - src/app/api/push/subscribe/route.ts
    - src/app/api/push/vapid-public/route.ts
    - src/features/notifications/ui/PushSubscribePrompt.tsx
    - src/features/notifications/lib/url-base64-to-uint8array.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - .env.test.example
    - .gitignore
    - src/shared/lib/notifications/deliver-notifications.ts
    - src/features/notifications/ui/NotificationBell.tsx

key-decisions:
  - "VAPID public key: NEXT_PUBLIC_VAPID_PUBLIC_KEY или GET /api/push/vapid-public"
  - "Soft opt-in в footer dropdown колокольчика, не banner в Header"
  - "deliverNotifications fire-and-forget — ошибки push не пробрасываются вызывающему коду"
  - "HTTP 410 от push service → delete PushSubscription по endpoint"

patterns-established:
  - "Pattern: subscribe POST upsert by endpoint, userId из session.user.id"
  - "Pattern: push payload JSON { title, body, url, notificationId } ↔ sw.js"

requirements-completed: [NOTF-06]

duration: 25min
completed: 2026-06-25
---

# Phase 09 Plan 04: Web Push with VAPID Summary

**Web Push через web-push + VAPID: service worker, subscribe API, post-commit send в deliverNotifications, opt-in UI (NOTF-06)**

## Performance

- **Duration:** 25 min
- **Started:** 2026-06-25T07:30:00Z
- **Completed:** 2026-06-25T07:55:00Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- `web-push@3.6.7`, `public/sw.js` (push + notificationclick → openWindow), lazy VAPID init
- `POST/DELETE /api/push/subscribe` — Zod, upsert по endpoint, привязка к `session.user.id`
- `sendPushToUser` с TTL 86400; удаление stale подписок при HTTP 410
- `deliverNotifications` вызывает `sendPushToUser` для каждого Notification post-commit
- `PushSubscribePrompt` в dropdown колокольчика — opt-in с localStorage dismiss/denied

## Task Commits

Each task was committed atomically:

1. **Task 1: web-push, VAPID config, public/sw.js** - `3230705` (feat)
2. **Task 2: Subscribe API + send-push + deliverNotifications** - `a8b1460` (feat)
3. **Task 3: PushSubscribePrompt UI** - `e743f5c` (feat)

## Files Created/Modified

- `public/sw.js` — обработчики push и notificationclick
- `src/shared/lib/push/vapid.ts` — `ensureVapidConfigured`, `getVapidPublicKey`
- `src/shared/lib/push/send-push.ts` — `sendPushToUser` с 410 cleanup
- `src/app/api/push/subscribe/route.ts` — POST upsert, DELETE по endpoint или все для user
- `src/app/api/push/vapid-public/route.ts` — публичный VAPID key для клиента
- `src/shared/lib/notifications/deliver-notifications.ts` — Web Push post-commit
- `src/features/notifications/ui/PushSubscribePrompt.tsx` — opt-in UX
- `.env.test.example` — VAPID_* и NEXT_PUBLIC_VAPID_PUBLIC_KEY placeholders

## Decisions Made

- Публичный ключ: env `NEXT_PUBLIC_VAPID_PUBLIC_KEY` или fallback GET `/api/push/vapid-public`
- Opt-in prompt в footer dropdown, не отдельный banner в Header
- Ошибки push логируются только в development; не блокируют domain transactions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] public/sw.js был в .gitignore**
- **Found during:** Task 1 (git add)
- **Issue:** PWA-артефакт из старого next-pwa игнорировал статический sw.js
- **Fix:** Убран `/public/sw.js` из .gitignore; файл добавлен в репозиторий
- **Files modified:** `.gitignore`, `public/sw.js`
- **Verification:** `git ls-files public/sw.js` — tracked
- **Committed in:** `3230705`

**2. [Rule 3 - Blocking] Отсутствовали типы для web-push**
- **Found during:** Task 1 (tsc verify)
- **Issue:** TS7016 — no declaration file for module 'web-push'
- **Fix:** `pnpm add -D @types/web-push`
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** tsc без ошибок в vapid.ts
- **Committed in:** `3230705`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Необходимы для корректного трекинга SW и TypeScript. Без расширения scope.

## Issues Encountered

- ESLint ignore для `src/app/api/**` — lint verify плана даёт warning (как в 09-02/09-03)
- Pre-existing tsc errors в других модулях (StudentSessionsTable, .next validator) — вне scope 09-04

## User Setup Required

**Web Push VAPID keys require per-environment configuration.**

Generate keys:
```bash
npx web-push generate-vapid-keys --json
```

Add to `.env`:
| Variable | Source |
|----------|--------|
| `VAPID_PUBLIC_KEY` | generate-vapid-keys → publicKey |
| `VAPID_PRIVATE_KEY` | generate-vapid-keys → privateKey (server only) |
| `VAPID_SUBJECT` | `mailto:admin@toykhana.ru` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | same as VAPID_PUBLIC_KEY for client subscribe |

Manual checklist: DevTools → Application → SW active; permission granted; row in PushSubscription table.

## Next Phase Readiness

- Готово для 09-05: Vitest mock send-push, Playwright bell/list E2E
- Production: сгенерировать VAPID keys и добавить в Coolify env перед push-тестированием
- SSE (09-03) остаётся in-app realtime; Web Push — для закрытой вкладки

## Self-Check: PASSED

- FOUND: public/sw.js
- FOUND: src/app/api/push/subscribe/route.ts
- FOUND: src/shared/lib/push/send-push.ts
- FOUND: src/features/notifications/ui/PushSubscribePrompt.tsx
- FOUND: commit 3230705
- FOUND: commit a8b1460
- FOUND: commit e743f5c

---
*Phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys*
*Completed: 2026-06-25*
