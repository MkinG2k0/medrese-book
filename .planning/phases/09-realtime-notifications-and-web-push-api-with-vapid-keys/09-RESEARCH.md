# Phase 9: Realtime notifications and Web Push API with VAPID keys — Research

**Researched:** 2026-06-25  
**Domain:** In-app notifications (Phase 6 foundation), SSE realtime, Web Push + VAPID, Prisma persistence  
**Confidence:** HIGH (stack/patterns verified in codebase + official web-push docs); MEDIUM (SSE multi-instance edge cases)

## Summary

Phase 9 must deliver **two layers**: (1) the **never-built Phase 6 foundation** — `Notification` model, bell UI, `enqueueNotifications` implementation — and (2) **realtime + Web Push** on top. Today `enqueueNotifications` is an intentional no-op stub [`src/shared/lib/domain-events/handlers/notifications.ts`](../../../src/shared/lib/domain-events/handlers/notifications.ts); domain events for leave/substitution already fire from [`leave-actions.ts`](../../../src/features/leave-requests/actions/leave-actions.ts) inside Prisma transactions.

**Primary recommendation:** Implement Phase 6 foundation first (Prisma + API + bell for all roles), then add **SSE on Node.js runtime** (`GET /api/notifications/stream`) with DB-tail polling for cross-instance safety, and **Web Push** via `web-push@3.6.7` + static `public/sw.js` + VAPID env keys. Defer **NOTF-03** (performance alerts) to a later phase; v1 covers only leave/substitution events (NOTF-04 scope).

Deployment context: Docker single Node process (`node server.js`, port 3000) [VERIFIED: `Dockerfile`] — **not** Vercel serverless. SSE with `export const runtime = 'nodejs'` is appropriate; Edge runtime is unnecessary and has timeout tradeoffs [CITED: Next.js community SSE guides 2026].

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Scope:** Realtime in-app delivery without page reload; Web Push with VAPID env keys; bell + unread count for **all roles**; first push events: new leave request (manager), decision (teacher), substitution (substitute).
- **Out of scope:** Personal messages / chat (Phase 7); Email / SMS / Telegram.
- **Dependencies:** Phase 6 foundation (Notification model, bell, in-app list) must be included — **was never implemented**; Phase 8 domain events are the event source.
- **Env / infra:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto or URL); service worker in `public/` or Next.js PWA pattern.

### Claude's Discretion

- Choice of realtime transport (SSE vs WebSocket vs polling) — research and recommend.
- NOTF-03 (performance alerts) — defer or minimal scope for v1.
- Internal module layout within FSD (`features/notifications`, `entities/notification`, API routes).
- Push opt-in UX (banner vs settings toggle).

### Deferred Ideas (OUT OF SCOPE)

- Chat / personal messages (Phase 7)
- Email / SMS / Telegram channels
- NOTF-03 full implementation (normative 48h, low grade alerts) — recommend **defer** for v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTF-01 | Колокольчик с количеством непрочитанных | `NotificationBell` in `AppShell` Header; `GET /api/notifications/unread-count`; Badge from React Query |
| NOTF-02 | In-app список непрочитанных, mark read | `GET /api/notifications`, `PATCH /api/notifications/[id]` or bulk mark-read; Dropdown panel |
| NOTF-03 | Уведомления об успеваемости | **Defer v1** — no domain events wired; stub enum slot optional |
| NOTF-04 | Системные (отпуск, замещение) | Map `LEAVE_REQUEST_*` + `SUBSTITUTION_ACTIVATED` in `enqueueNotifications`; copy from 08-UI-SPEC |
| Phase 9 SC-1 | Realtime without reload | SSE stream + invalidate React Query on event |
| Phase 9 SC-2 | Web Push subscription + key events | `web-push`, `PushSubscription` model, `public/sw.js` |
| Phase 9 SC-3 | VAPID via env | `setVapidDetails` at server startup; `.env.test.example` extension |
| Phase 9 SC-4 | Bell for all roles | Render in `AppShell` Header for every authenticated dashboard role |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `web-push` | **3.6.7** | VAPID signing, encrypted push send | De-facto Node library for Web Push Protocol [CITED: github.com/web-push-libs/web-push] |
| Next.js Route Handlers | 16.1.6 | SSE stream, REST API | Existing pattern in `src/app/api/*` [VERIFIED: codebase] |
| Prisma | 7.8.0 | `Notification`, `PushSubscription` | Project ORM [VERIFIED: `package.json`] |
| `@tanstack/react-query` | 5.90.21 | Bell list, unread count, cache invalidation | Existing entity hooks pattern [VERIFIED: `use-students.ts`] |
| Ant Design 6 | 6.4.3 | `Badge`, `Dropdown`, `List`, `BellOutlined` | App shell UI kit [VERIFIED: `AppShell.tsx`] |
| Zod | 4.3.6 | Push subscription body, notification filters | Project validation standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `EventSource` | — | SSE client | Same-origin GET with session cookie |
| `date-fns` | 4.1.0 | Format dates in notification copy | Already used in leave-actions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **SSE (recommended)** | WebSocket | WS needs sticky sessions or separate WS server; overkill for one-way notifications [ASSUMED: medrese scale] |
| **SSE + DB poll** | In-memory EventEmitter only | In-memory instant but breaks with multiple Node replicas; DB poll works on 1..N instances |
| **SSE** | React Query `refetchInterval` only | Simpler but not a dedicated realtime channel; use as **fallback** when SSE disconnects |
| `next-pwa` | Static `public/sw.js` | PWA plugin adds build complexity; minimal SW sufficient for push-only v1 |
| Server Actions for list | REST + React Query | Mutations/list polling already REST-first in entities layer |

**Installation:**

```bash
pnpm add web-push
pnpm add -D @types/web-push   # only if TS types missing (package may ship own types)
```

**Version verification:** `npm view web-push version` → **3.6.7** (2026-06-25) [VERIFIED: npm registry]

**VAPID key generation (one-time per environment):**

```bash
npx web-push generate-vapid-keys --json
```

Store in env; never commit private key [CITED: web-push README].

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── features/notifications/
│   ├── ui/
│   │   ├── NotificationBell.tsx      # Badge + dropdown
│   │   ├── NotificationList.tsx
│   │   └── PushSubscribePrompt.tsx   # optional opt-in banner
│   └── index.ts
├── entities/notification/
│   ├── api/
│   │   ├── use-notifications.ts
│   │   ├── use-unread-count.ts
│   │   └── use-notification-stream.ts  # EventSource hook
│   ├── model/types.ts
│   └── index.ts
├── shared/lib/notifications/
│   ├── enqueue-notifications.ts      # moved logic from handlers/
│   ├── build-notification.ts         # copy + recipients per DomainEventAction
│   ├── deliver-notifications.ts      # post-commit: push + SSE signal
│   └── notification-hub.ts           # in-process SSE subscriber registry (optional wake)
├── shared/lib/push/
│   ├── vapid.ts                      # setVapidDetails from env
│   └── send-push.ts                  # webpush.sendNotification wrapper
├── app/api/notifications/
│   ├── route.ts                      # GET list
│   ├── unread-count/route.ts
│   ├── mark-read/route.ts            # PATCH bulk
│   └── stream/route.ts               # SSE
└── app/api/push/
    └── subscribe/route.ts            # POST upsert, DELETE by endpoint

public/
└── sw.js                             # push + notificationclick handlers

prisma/schema.prisma                  # Notification, PushSubscription models
```

### Pattern 1: Transaction-safe enqueue + post-commit delivery

**What:** DB writes inside transaction; network I/O (Web Push, SSE wake) **after** commit.

**When:** Every `dispatchDomainEvent` call inside `prisma.$transaction` (leave-actions pattern).

**Why:** Web Push can fail/slow; must not roll back business transaction. Prisma tx cannot await external HTTP reliably.

**Example flow:**

```typescript
// dispatch.ts — return created rows
export async function dispatchDomainEvent(event: DomainEvent, tx?: Prisma.TransactionClient) {
  await writeAuditEvent(event, tx)
  return enqueueNotifications(event, tx) // returns Notification[]
}

// leave-actions.ts
const notifications = await prisma.$transaction(async (tx) => {
  // ... mutate ...
  return dispatchDomainEvent({ ... }, tx)
})
void deliverNotifications(notifications) // fire-and-forget after commit
```

[CITED: Prisma transaction best practice — external side effects after commit]

### Pattern 2: SSE stream with DB tail + heartbeat

**What:** Long-lived `GET /api/notifications/stream`; server polls DB for rows newer than `lastId` / `createdAt` cursor; emits SSE `data:` frames; heartbeat every 30s.

**When:** Logged-in dashboard users (all roles).

**Headers (required):**

```typescript
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Docker single Node — no Edge timeout issues

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx/Coolify proxy
  },
})
```

[CITED: Next.js SSE guides 2026; MDN EventSource]

**Auth:** `await auth()` inside route handler — do **not** trust `userId` query param alone [CITED: DEV SSE auth pattern 2026].

**Client:**

```typescript
// use-notification-stream.ts
useEffect(() => {
  const es = new EventSource('/api/notifications/stream')
  es.onmessage = (e) => {
    const payload = JSON.parse(e.data)
    if (payload.type === 'notification') {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  }
  return () => es.close()
}, [])
```

### Pattern 3: Web Push subscribe + send

**Server — VAPID setup (once per process):**

```typescript
// Source: github.com/web-push-libs/web-push README
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!, // mailto:admin@toykhana.ru
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)
```

**Client — subscribe after login:**

```typescript
const reg = await navigator.serviceWorker.register('/sw.js')
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
})
await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub), ... })
```

**Service worker (`public/sw.js`):**

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
      icon: '/icon.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'))
})
```

[CITED: web-push README; MDN Web Push tutorials]

### Pattern 4: Domain event → recipients + copy

| Event | Recipients | Title/body (Russian) |
|-------|------------|------------------------|
| `LEAVE_REQUEST_CREATED` | All `MANAGER` + `SUPER_ADMIN` users | «Новая заявка на отсутствие» / `{teacherName}, {type}, {dates}` |
| `LEAVE_REQUEST_APPROVED` | `payload.teacherUserId` | «Заявка подтверждена» |
| `LEAVE_REQUEST_REJECTED` | `payload.teacherUserId` | «Заявка отклонена» + reason from payload |
| `SUBSTITUTION_ACTIVATED` | substitute's `userId` (lookup via `substituteTeacherId`) | «Вы замещаете {ФИО} с {дата} по {дата}» [from 08-UI-SPEC] |

Payload shape already in events: `teacherUserId`, `substituteTeacherId`, `startDate`, `endDate`, `type` [VERIFIED: `buildLeaveEventPayload` in leave-actions].

**Manager fan-out:** `prisma.user.findMany({ where: { role: { in: ['MANAGER', 'SUPER_ADMIN'] } } })` [VERIFIED: seed creates MANAGER role].

### Pattern 5: API routes (match existing conventions)

- Auth: `authorizeApiRequest()` or `auth()` + role check [VERIFIED: `src/app/api/leave-requests/route.ts`]
- Response: `success()` / `error()` from `@/shared/api` [VERIFIED]
- Middleware: all `/api/*` except `/api/auth` require session JSON 401 [VERIFIED: `auth.config.ts`]

### Anti-Patterns to Avoid

- **Web Push inside Prisma transaction:** Slow/failing push must not block leave approval.
- **SSE on Edge runtime in Docker:** Unnecessary; Node runtime matches deployment.
- **Trusting URL params for SSE userId:** Session-only identification.
- **Service worker behind auth middleware:** Add `sw.js` to middleware `matcher` exclusion or SW fetch may get 401/redirect.
- **Hand-rolling Web Push encryption:** Use `web-push` — RFC 8291/8292 complexity.
- **Cross-feature imports in enqueue:** Keep notification builder in `shared/lib/notifications`; consume domain event types only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web Push encryption + VAPID JWT | Custom crypto | `web-push` | aes128gcm, ECDH, VAPID signing |
| VAPID key generation | openssl scripts | `web-push generate-vapid-keys` | Correct P-256 base64url format |
| SSE wire format | Custom long-polling protocol | `ReadableStream` + SSE headers | Browser `EventSource`, proxy compatibility |
| Notification persistence | In-memory only | Prisma `Notification` | Survives restart; unread history |
| Stale push endpoints | Ignore errors | Delete on HTTP 410 Gone | Standard push service behavior [CITED: web-push] |

---

## Common Pitfalls

### Pitfall 1: Middleware blocks `sw.js`

**What goes wrong:** Service worker file returns 401/redirect; `pushManager.subscribe()` fails.  
**Why:** `middleware.ts` matcher does not exclude `sw.js` [VERIFIED: `middleware.ts`].  
**How to avoid:** Extend matcher: `(?!...|sw\.js|manifest\.webmanifest)`.  
**Warning signs:** Console: SW registration failed; 401 on `/sw.js`.

### Pitfall 2: Phase 6 assumed done

**What goes wrong:** Planner skips Notification model / bell; Phase 9 has nothing to push.  
**Why:** Roadmap lists Phase 6 separately but it was never implemented; stub `enqueueNotifications` confirms [VERIFIED].  
**How to avoid:** Wave 1 explicitly delivers NOTF-01/02/04 foundation before SSE/push.

### Pitfall 3: SSE multi-instance gap

**What goes wrong:** User connected to replica A; mutation on replica B; no SSE wake on A.  
**Why:** In-memory hub is per-process.  
**How to avoid:** DB tail polling inside SSE loop (2–3s); document limitation; add Redis pub/sub only if scaling past 1 replica [ASSUMED: v1 single Docker instance OK].

### Pitfall 4: `EventSource` and HTTPS

**What goes wrong:** Push/SW require secure context (localhost exception).  
**How to avoid:** Test push on HTTPS staging; local dev OK on `http://localhost`.

### Pitfall 5: Safari VAPID subject

**What goes wrong:** `BadJwtToken` if `VAPID_SUBJECT` is `https://localhost/...` [CITED: web-push README].  
**How to avoid:** Use `mailto:admin@toykhana.ru` or production URL.

### Pitfall 6: Playwright Web Push

**What goes wrong:** E2E cannot easily assert native OS notifications.  
**How to avoid:** E2E tests: DB notification row + bell badge + SSE/API; unit test `send-push` mocked; manual checklist for push.

---

## Code Examples

### Prisma models (recommended)

```prisma
enum NotificationType {
  LEAVE_REQUEST_CREATED
  LEAVE_REQUEST_APPROVED
  LEAVE_REQUEST_REJECTED
  SUBSTITUTION_ACTIVATED
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  link      String?
  payload   Json?
  readAt    DateTime?
  createdAt DateTime         @default(now())

  @@index([userId, readAt])
  @@index([userId, createdAt])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Add `notifications Notification[]` and `pushSubscriptions PushSubscription[]` on `User`.

### SSE route skeleton

```typescript
// src/app/api/notifications/stream/route.ts
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return unauthorized()

  const userId = session.user.id
  const encoder = new TextEncoder()
  let lastSeen = new Date()

  const stream = new ReadableStream({
    start(controller) {
      const poll = async () => {
        const rows = await prisma.notification.findMany({
          where: { userId, createdAt: { gt: lastSeen } },
          orderBy: { createdAt: 'asc' },
          take: 20,
        })
        for (const row of rows) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'notification', id: row.id })}\n\n`),
          )
          lastSeen = row.createdAt
        }
      }

      const pollId = setInterval(() => void poll(), 2000)
      const heartbeatId = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(pollId)
        clearInterval(heartbeatId)
        controller.close()
      })

      void poll()
    },
  })

  return new Response(stream, { headers: { /* SSE headers */ } })
}
```

### Push payload from server

```typescript
await webpush.sendNotification(
  { endpoint, keys: { p256dh, auth } },
  JSON.stringify({ title, body, url: link, notificationId: id }),
  { TTL: 60 * 60 * 24 },
)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GCM-only push | VAPID required (Chrome 52+) | 2016+ | No Firebase required for web push |
| `aesgcm` encoding | `aes128gcm` default in web-push | RFC 8188 | Library handles selection |
| Phase 6 separate | Phase 9 bundles foundation | 2026-06-25 roadmap | Planner must not assume Phase 6 exists |

**Deprecated/outdated:**
- Socket.io for simple notifications in Next.js App Router — adds WS server complexity without benefit for one-way alerts.

---

## Recommended Plan Breakdown (Waves)

| Wave | Focus | Delivers |
|------|-------|----------|
| **09-01** | Prisma + enqueue | `Notification`/`PushSubscription` migration; implement `enqueueNotifications`; refactor `dispatchDomainEvent` return; wire leave-actions post-commit `deliverNotifications` stub; unit tests for recipient/copy builder |
| **09-02** | Phase 6 UI + REST | `GET /api/notifications`, unread count, mark-read; `NotificationBell` in `AppShell` Header (all roles); `entities/notification` hooks; NOTF-01/02/04 for leave events |
| **09-03** | Realtime SSE | `GET /api/notifications/stream`; `useNotificationStream`; middleware exclude `sw.js`; E2E: teacher creates leave → manager bell increments without reload |
| **09-04** | Web Push | `pnpm add web-push`; env vars; `public/sw.js`; subscribe API; `send-push` with 410 cleanup; `PushSubscribePrompt`; manual test checklist |
| **09-05** | Hardening + E2E | Vitest for push helper; Playwright bell/list tests; document NOTF-03 deferral; optional UI-SPEC for bell copy |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Production runs **single Node container** (Coolify) | SSE / multi-instance | Need Redis pub/sub if multiple replicas |
| A2 | Managers receive **all** new leave requests (no per-group scoping) | Recipients | May need group filter later |
| A3 | Students get bell UI but **zero events** in v1 | All roles bell | OK per spec; empty state required |
| A4 | `public/sw.js` must be excluded from auth middleware | Pitfall 1 | SW broken if assumption wrong and not fixed |
| A5 | NOTF-03 deferred entirely for v1 | User discretion | Product may want minimal grade alert — confirm in plan review |

---

## Open Questions (RESOLVED)

1. **Push opt-in UX:** Banner on first login vs silent register attempt? — **RESOLVED:** Soft prompt in Header after bell ships (`PushSubscribePrompt` in 09-04); respect `Notification.permission`.

2. **SUPER_ADMIN notifications:** Same as MANAGER for new leave requests? — **RESOLVED:** Yes — include in manager fan-out in `build-notification.ts` (09-01).

3. **`next.config` standalone vs Dockerfile:** Dockerfile copies `.next/standalone` but `next.config.ts` lacks `output: 'standalone'` — **RESOLVED:** Out of Phase 9 scope; infra task if deploy broken.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | web-push, SSE | ✓ | 22.22.0 | — |
| pnpm | install | ✓ | 10.32.1 | npm |
| PostgreSQL | Notification storage | ✓ (app running) | via DATABASE_URL | Remote Neon per README |
| `web-push` package | Push send | ✗ not installed | 3.6.7 on npm | Wave 09-04 install |
| VAPID keys | Push auth | ✗ not in repo | — | Generate per env |
| HTTPS (staging/prod) | Web Push API | ✓ toykhana.ru | — | localhost OK for dev SW only |
| pg_isready CLI | — | ✗ Windows dev | — | Not blocking |

**Missing dependencies with no fallback:**
- VAPID keys must be generated before push testing in staging/prod.

**Missing dependencies with fallback:**
- `web-push` — install in plan Wave 09-04.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit), Playwright 1.61.0 (E2E) |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `pnpm test:unit` |
| Full suite command | `pnpm test:unit && pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTF-01 | Unread count on bell | E2E | `pnpm test:e2e e2e/notifications.spec.ts` | ❌ Wave 09-05 |
| NOTF-02 | List + mark read | E2E | same | ❌ Wave 09-05 |
| NOTF-04 | Leave create → manager notification row | E2E + DB | extend `e2e/domain-events` or new spec | ❌ Wave 09-05 |
| NOTF-04 | Approve → teacher notification | E2E | `e2e/notifications.spec.ts` | ❌ Wave 09-05 |
| Phase 9 SC-1 | Realtime without reload | E2E | manager page open + teacher creates leave → badge updates | ❌ Wave 09-05 |
| Phase 9 SC-2 | Push subscription stored | unit + manual | `src/shared/lib/push/send-push.test.ts` (mocked) | ❌ Wave 09-04 |
| enqueue | Recipient mapping | unit | `src/shared/lib/notifications/build-notification.test.ts` | ❌ Wave 09-01 |

### Sampling Rate

- **Per task commit:** `pnpm test:unit`
- **Per wave merge:** `pnpm test:e2e e2e/notifications.spec.ts` (when created)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `e2e/notifications.spec.ts` — bell, realtime, leave integration
- [ ] `e2e/helpers/notifications.ts` — DB helpers for Notification table
- [ ] `src/shared/lib/notifications/build-notification.test.ts` — copy/recipients
- [ ] `.env.test.example` — VAPID_* placeholders for E2E (push tests mocked)
- [ ] `web-push` dependency — Wave 09-04

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | NextAuth session on all notification/push API routes |
| V3 Session Management | yes | JWT session; SSE uses cookie auth |
| V4 Access Control | yes | Users read only own notifications; push subscriptions scoped to `session.user.id` |
| V5 Input Validation | yes | Zod for push subscription JSON |
| V6 Cryptography | yes | VAPID via `web-push`; never log private key |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on notifications | Elevation | Filter `where: { userId: session.user.id }` on all queries |
| Forged push subscription | Spoofing | Bind subscription to authenticated user server-side |
| VAPID private key leak | Information disclosure | Env only; not in client bundle |
| SSE user impersonation | Spoofing | `auth()` in stream route, no client-supplied userId |
| XSS in notification body | Tampering | Store server-generated copy only; escape in UI (React default) |

---

## Project Constraints (from workspace rules)

- **Stack lock:** Next.js 16 + Prisma 7 + PostgreSQL + FSD — no migration [VERIFIED: CLAUDE.md]
- **New feature code:** `src/features/notifications/`, follow server actions / API routes pattern
- **Language:** UI strings Russian
- **Domain events:** Extend `enqueueNotifications` in `shared/lib/domain-events/handlers/` — no cross-feature imports from leave-requests
- **API responses:** `{ data, error }` helpers from `@/shared/api`
- **No `.cursor/rules/`** directory found — conventions from CLAUDE.md / CONVENTIONS.md apply

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase] `enqueueNotifications` stub, `dispatchDomainEvent`, `leave-actions` payloads, `AppShell` (no bell), `prisma/schema.prisma` (no Notification), `auth.config.ts`, `middleware.ts`, `Dockerfile`
- [CITED: github.com/web-push-libs/web-push README] `generateVAPIDKeys`, `setVapidDetails`, `sendNotification`, 410 handling, Safari subject note
- [VERIFIED: npm registry] `web-push@3.6.7`

### Secondary (MEDIUM confidence)

- [CITED: nextjslaunchpad.com SSE guide 2026] ReadableStream SSE pattern, headers, `X-Accel-Buffering`
- [CITED: letsbuildsolutions.com] `runtime = 'nodejs'` for long-lived SSE
- [CITED: 08-UI-SPEC.md] substitution notification copy

### Tertiary (LOW confidence — flag for validation)

- [ASSUMED] Single Docker instance in production — confirm Coolify replica count

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — web-push verified; stack from package.json
- Architecture: **HIGH** — patterns match existing FSD/API/domain-events
- Pitfalls: **MEDIUM** — middleware/SW interaction verified in code; multi-instance based on deploy assumption

**Research date:** 2026-06-25  
**Valid until:** 2026-07-25 (stable domain); re-check web-push if major release

---

## RESEARCH COMPLETE
