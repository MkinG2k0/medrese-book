---
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
reviewed: 2026-06-25T12:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - prisma/schema.prisma
  - prisma/migrations/20260625070224_notifications_push_subscriptions/migration.sql
  - src/shared/lib/notifications/build-notification.ts
  - src/shared/lib/notifications/enqueue-notifications.ts
  - src/shared/lib/notifications/deliver-notifications.ts
  - src/shared/lib/domain-events/dispatch.ts
  - src/shared/lib/domain-events/handlers/notifications.ts
  - src/features/leave-requests/actions/leave-actions.ts
  - src/shared/lib/validations/notification.ts
  - src/shared/lib/validations/push-subscription.ts
  - src/app/api/notifications/route.ts
  - src/app/api/notifications/unread-count/route.ts
  - src/app/api/notifications/mark-read/route.ts
  - src/app/api/notifications/stream/route.ts
  - src/app/api/push/subscribe/route.ts
  - src/app/api/push/vapid-public/route.ts
  - src/shared/lib/push/vapid.ts
  - src/shared/lib/push/send-push.ts
  - src/shared/lib/authorize-api-request.ts
  - src/shared/lib/auth.config.ts
  - middleware.ts
  - public/sw.js
  - src/entities/notification/api/use-notification-stream.ts
  - src/entities/notification/api/use-notifications.ts
  - src/entities/notification/api/use-mark-notification-read.ts
  - src/features/notifications/ui/NotificationBell.tsx
  - src/features/notifications/ui/NotificationList.tsx
  - src/features/notifications/ui/PushSubscribePrompt.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-06-25T12:00:00Z  
**Depth:** standard  
**Files Reviewed:** 28  
**Status:** issues_found

## Summary

Проведён стандартный ревью исходников фазы 09 (уведомления, SSE, Web Push) с фокусом на IDOR, авторизацию SSE, экспозицию VAPID и безопасность push-подписок.

**Положительные находки:**
- REST API уведомлений корректно ограничивает доступ через `userId: session.user.id` во всех запросах (список, счётчик, mark-read).
- SSE stream берёт `userId` только из `session.user.id`, без query-параметров; маршрут защищён middleware + `auth()`.
- `VAPID_PRIVATE_KEY` используется только в серверном `vapid.ts`; публичный ключ отдаётся намеренно через env или `/api/push/vapid-public`.
- DTO уведомлений не включает поле `payload` — внутренние данные событий не утекают через API.
- DELETE push-подписки ограничен `userId: session.user.id`.

**Основные риски:** переназначение чужой push-подписки при upsert, пропуск уведомлений в SSE при коллизии `createdAt`, отсутствие обработки ошибок в poll-цикле SSE.

## Warnings

### WR-01: Переназначение push-подписки другому пользователю (endpoint hijacking)

**File:** `src/app/api/push/subscribe/route.ts:30-43`  
**Issue:** `upsert` по `endpoint` в ветке `update` безусловно перезаписывает `userId` на `session.user.id`. Если злоумышленник знает `endpoint` + `keys` чужой подписки (утечка из БД, XSS, перехват), он может переназравить push-уведомления жертвы на свой аккаунт. Threat model T-9-12 помечен как mitigated, но upsert-update создаёт окно для hijack.  
**Fix:** Перед обновлением проверять владельца; при конфликте возвращать 409, а не переназначать:

```typescript
const existing = await prisma.pushSubscription.findUnique({
  where: { endpoint },
  select: { userId: true },
})

if (existing && existing.userId !== session.user.id) {
  return error('Подписка уже принадлежит другому пользователю', 409)
}

const subscription = await prisma.pushSubscription.upsert({
  where: { endpoint },
  create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  update: { p256dh: keys.p256dh, auth: keys.auth }, // userId не менять
})
```

Для сценария «новый пользователь на том же браузере» — сначала `DELETE` старых подписок при logout или явный re-subscribe flow.

### WR-02: SSE может пропустить уведомления при одинаковом `createdAt`

**File:** `src/app/api/notifications/stream/route.ts:19-32`  
**Issue:** Poll использует `createdAt: { gt: lastSeen }`. После эмита уведомления с `createdAt = T` поле `lastSeen` становится `T`. Следующее уведомление с тем же `createdAt` (возможно при быстрых последовательных событиях или совпадении миллисекунд) не попадёт в выборку — badge не обновится до fallback-polling (60s).  
**Fix:** Использовать составной курсор `(createdAt, id)`:

```typescript
let cursor: { createdAt: Date; id: string } | null = null

const rows = await prisma.notification.findMany({
  where: {
    userId,
    ...(cursor
      ? {
          OR: [
            { createdAt: { gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { gt: cursor.id } },
          ],
        }
      : { createdAt: { gt: lastSeen } }),
  },
  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  take: 20,
})
// после эмита: cursor = { createdAt: row.createdAt, id: row.id }
```

### WR-03: Необработанные ошибки Prisma в SSE poll-цикле

**File:** `src/app/api/notifications/stream/route.ts:18-34`  
**Issue:** `poll()` вызывается через `setInterval(() => void poll(), 2000)` без `try/catch`. Ошибка Prisma (таймаут, разрыв соединения) приведёт к необработанному rejection; клиент останется на «мёртвом» соединении без событий до reconnect (макс. 3 попытки).  
**Fix:**

```typescript
const poll = async () => {
  try {
    const rows = await prisma.notification.findMany({ /* ... */ })
    for (const row of rows) { /* enqueue */ }
  } catch {
    controller.enqueue(encoder.encode(': error\n\n'))
    // опционально: controller.close() для принудительного reconnect клиента
  }
}
```

## Info

### IN-01: `mark-read` не ограничивает размер массива `ids`

**File:** `src/shared/lib/validations/notification.ts:4-8`  
**Issue:** Zod-схема требует `min(1)`, но не `max`. Авторизованный пользователь может отправить очень большой массив ID — лишняя нагрузка на `updateMany` (DoS-lite). IDOR не возникает (`userId` в where), но стоит ограничить.  
**Fix:** `.max(100, 'Слишком много уведомлений за один запрос')` на массив `ids`.

### IN-02: `sw.js` открывает URL из push без проверки origin

**File:** `public/sw.js:16-19`  
**Issue:** `clients.openWindow(url)` принимает значение из push-payload без валидации. Сейчас сервер генерирует только относительные пути (`/calendar`, `/journal`), риск низкий. При будущем расширении (динамические ссылки из БД) возможен open redirect.  
**Fix:** Проверять, что URL относительный или same-origin:

```javascript
const raw = event.notification.data?.url ?? '/'
const url = new URL(raw, self.location.origin)
if (url.origin !== self.location.origin) return
event.waitUntil(clients.openWindow(url.pathname + url.search))
```

---

## Проверенные области (без замечаний)

| Область | Вердикт |
|---------|---------|
| IDOR в notification REST API | ✅ `where: { userId: session.user.id }` во всех маршрутах |
| SSE auth | ✅ `auth()` + middleware; `userId` только из сессии |
| VAPID private key exposure | ✅ Только `process.env.VAPID_PRIVATE_KEY` в server-only коде |
| VAPID public key exposure | ✅ Ожидаемо публичен (env / API); не является уязвимостью |
| Push send scope | ✅ `sendPushToUser` загружает подписки по `userId` из Notification |
| Stale push cleanup | ✅ HTTP 410 → `delete` по endpoint |
| Notification payload в API | ✅ Не включён в DTO |
| SSE connection flood (T-9-10) | ℹ️ Принят в threat model как deferred |

---

_Reviewed: 2026-06-25T12:00:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_
