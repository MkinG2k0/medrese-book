---
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
verified: 2026-06-25T11:10:00Z
status: passed
score: 6/6
overrides_applied: 0
human_verification:
  - test: "OS-level Web Push при закрытой вкладке"
    expected: "После подписки через «Включить уведомления» и создания заявки на отпуск пользователь получает нативное push-уведомление ОС"
    why_human: "Playwright не может проверить нативные push-уведомления; unit-тесты мокают web-push"
  - test: "Регистрация service worker /sw.js"
    expected: "DevTools → Application → Service Workers: /sw.js active после opt-in"
    why_human: "Диалог разрешений браузера и состояние SW не верифицируются статическим анализом"
re_verification: false
---

# Phase 9: Realtime notifications and Web Push API with VAPID keys — Verification Report

**Phase Goal:** Пользователи получают уведомления в реальном времени и через Web Push; колокольчик работает для всех ролей  
**Verified:** 2026-06-25T11:10:00Z (human approved 2026-06-25)  
**Status:** passed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Новое in-app уведомление появляется без перезагрузки (NOTF-05 / SC-1) | ✓ VERIFIED | `GET /api/notifications/stream` — SSE poll 2s + heartbeat 30s; `useNotificationStream` → `invalidateQueries`; E2E `badge менеджера обновляется без reload` в `e2e/notifications.spec.ts` |
| 2 | Колокольчик и счётчик непрочитанных для всех ролей (NOTF-01 / SC-4) | ✓ VERIFIED | `NotificationBell` в `AppShell` Header без `RoleGuard`; API `allowedRoles` включает `STUDENT`; ученики в `(dashboard)/student/*` используют тот же `AppShell` |
| 3 | Список in-app + отметка прочитанным (NOTF-02) | ✓ VERIFIED | `NotificationList` + `useNotifications` / `useMarkNotificationRead`; пустое состояние «Нет новых уведомлений»; E2E mark-all-read |
| 4 | Системные уведомления от leave/substitution (NOTF-04) | ✓ VERIFIED | `buildNotificationsForEvent` для `LEAVE_REQUEST_*`, `SUBSTITUTION_ACTIVATED`; `enqueueNotifications` + post-commit `deliverNotifications` из `leave-actions.ts`; E2E copy assertions |
| 5 | Web Push subscribe + server push при событиях (NOTF-06 / SC-2) | ✓ VERIFIED (код) | `PushSubscribePrompt` → register `/sw.js` → POST `/api/push/subscribe`; `deliverNotifications` → `sendPushToUser`; unit `send-push.test.ts` (mock web-push, 410 cleanup) |
| 6 | VAPID через env; sw.js с push/notificationclick (NOTF-06 / SC-3) | ✓ VERIFIED (код) | `vapid.ts` — `VAPID_*` env; `public/sw.js` handlers; `.env.test.example` placeholders; `VAPID_PRIVATE_KEY` только в server (`vapid.ts`, test) |

**Score:** 6/6 truths verified (automated / static analysis)

### NOTF-03 (отложено)

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| NOTF-03: уведомления об успеваемости | Отложено (вне scope Phase 9) | `09-DEFERRED.md` — нет domain events / cron; enum `PERFORMANCE_ALERT` не добавлен; ROADMAP Phase 9 явно исключает NOTF-03 |

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | NOTF-03: алерты норматива 48ч и низкой оценки | Будущая фаза (ANLY-07 / grade alerts) | `09-DEFERRED.md`; ROADMAP Phase 9: «NOTF-03 отложен» |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | Notification + PushSubscription | ✓ VERIFIED | enum `NotificationType`, модели с индексами и cascade |
| `prisma/migrations/20260625070224_notifications_push_subscriptions/` | Миграция | ✓ VERIFIED | CREATE TABLE Notification, PushSubscription |
| `src/shared/lib/notifications/build-notification.ts` | Copy/recipients | ✓ VERIFIED | 151 строк, unit-тесты 12 passed |
| `src/shared/lib/notifications/enqueue-notifications.ts` | Persist in tx | ✓ VERIFIED | `createManyAndReturn`, role fan-out |
| `src/shared/lib/notifications/deliver-notifications.ts` | Post-commit push | ✓ VERIFIED | `sendPushToUser` per notification |
| `src/app/api/notifications/route.ts` | GET list | ✓ VERIFIED | `userId: session.user.id` |
| `src/app/api/notifications/unread-count/route.ts` | GET count | ✓ VERIFIED | session-scoped |
| `src/app/api/notifications/mark-read/route.ts` | PATCH mark read | ✓ VERIFIED | `updateMany` scoped to session |
| `src/app/api/notifications/stream/route.ts` | SSE | ✓ VERIFIED | `text/event-stream`, auth, poll, heartbeat |
| `src/features/notifications/ui/NotificationBell.tsx` | Bell + Badge | ✓ VERIFIED | wired hooks + stream |
| `src/widgets/app-shell/ui/AppShell.tsx` | Bell in Header | ✓ VERIFIED | import + render line 242 |
| `public/sw.js` | push + click | ✓ VERIFIED | `showNotification`, `clients.openWindow` |
| `src/app/api/push/subscribe/route.ts` | POST/DELETE | ✓ VERIFIED | upsert by endpoint, session userId |
| `src/shared/lib/push/send-push.ts` | web-push wrapper | ✓ VERIFIED | TTL 86400, 410 delete |
| `e2e/notifications.spec.ts` | Full E2E suite | ✓ VERIFIED | 315 строк, 6 top-level tests |
| `e2e/helpers/notifications.ts` | DB helpers | ✓ VERIFIED | countUnread, getUserIdByCode, etc. |
| `09-DEFERRED.md` | NOTF-03 rationale | ✓ VERIFIED | explicit deferral doc |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `NotificationBell.tsx` | `/api/notifications/unread-count` | `useUnreadCount` | ✓ WIRED | fetch + Badge count |
| `NotificationList.tsx` | `/api/notifications/mark-read` | `useMarkNotificationRead` | ✓ WIRED | PATCH + invalidate |
| `useNotificationStream` | `/api/notifications/stream` | EventSource | ✓ WIRED | onmessage → invalidateQueries |
| `leave-actions.ts` | `deliverNotifications` | post-commit void | ✓ WIRED | 4 call sites |
| `dispatch.ts` | `enqueueNotifications` | return in tx | ✓ WIRED | `return enqueueNotifications(event, tx)` |
| `PushSubscribePrompt.tsx` | `/api/push/subscribe` | fetch POST | ✓ WIRED | after pushManager.subscribe |
| `deliver-notifications.ts` | `send-push.ts` | sendPushToUser | ✓ WIRED | Promise.allSettled |
| `middleware.ts` | `sw.js` | matcher exclusion | ✓ WIRED | `(?!...|sw\\.js)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `NotificationBell` | `unreadCount` | `useUnreadCount` → prisma.count | ✓ DB query | ✓ FLOWING |
| `NotificationList` | `notifications` | `useNotifications` → findMany | ✓ DB query | ✓ FLOWING |
| SSE stream | new rows | prisma.notification.findMany poll | ✓ DB query | ✓ FLOWING |
| `deliverNotifications` | push payload | Notification row fields | ✓ from persisted rows | ✓ FLOWING |
| `PushSubscribePrompt` | subscription | pushManager + POST upsert | ✓ real browser API + DB | ⚠️ needs human for permission dialog |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| build-notification unit tests | `pnpm test:unit -- src/shared/lib/notifications/build-notification.test.ts` | 12 tests passed (combined run) | ✓ PASS |
| send-push unit tests | `pnpm test:unit -- src/shared/lib/push/send-push.test.ts` | included in 12 passed | ✓ PASS |
| E2E notifications suite | `pnpm test:e2e e2e/notifications.spec.ts` | ? SKIP | ? SKIP — не запускался (требует dev server + DB + auth seed); SUMMARY/VALIDATION.md отмечают green |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| NOTF-01 | 09-02, 09-05 | Колокольчик с количеством непрочитанных | ✓ SATISFIED | NotificationBell + unread-count API + E2E badge |
| NOTF-02 | 09-02, 09-05 | In-app уведомления | ✓ SATISFIED | NotificationList, mark-read, E2E dropdown |
| NOTF-03 | — | Успеваемость (норматив, оценка) | ⊘ DEFERRED | `09-DEFERRED.md`; вне scope Phase 9 |
| NOTF-04 | 09-01, 09-02, 09-05 | Системные (отпуск, замещение) | ✓ SATISFIED | domain events → enqueue; E2E copy |
| NOTF-05 | 09-03, 09-05 | Realtime SSE без reload | ✓ SATISFIED | stream route + hook + E2E realtime test |
| NOTF-06 | 09-04, 09-05 | Web Push + VAPID + SW | ✓ SATISFIED (код) | sw.js, subscribe API, send-push; OS delivery — human |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | Нет blocker-стабов | — | — |

Проверены ключевые файлы фазы: TODO/FIXME/placeholder не найдены. `deliverNotifications` не stub — вызывает `sendPushToUser`. SSE не возвращает пустой статический массив — poll по Prisma.

### Human Verification Required

### 1. OS-level Web Push

**Test:** На HTTPS/staging: войти как менеджер → «Включить уведомления» → учитель создаёт заявку → закрыть вкладку менеджера.  
**Expected:** Нативное push-уведомление ОС с title/body из Notification.  
**Why human:** Playwright не проверяет native push; unit-тесты мокают `web-push`.

### 2. Service Worker registration

**Test:** После opt-in открыть DevTools → Application → Service Workers.  
**Expected:** `/sw.js` зарегистрирован и active.  
**Why human:** Зависит от диалога разрешений браузера и HTTPS.

### Gaps Summary

Автоматизированная верификация не выявила пробелов в реализации Phase 9. Все roadmap success criteria и требования NOTF-01, 02, 04, 05, 06 подтверждены в коде и unit-тестах. NOTF-03 намеренно отложен и задокументирован.

Статус `human_needed`: доставка push на уровне ОС и регистрация service worker требуют ручной проверки в браузере (см. `09-VALIDATION.md` Manual-Only Verifications).

---

_Verified: 2026-06-25T11:10:00Z_  
_Verifier: Claude (gsd-verifier)_
