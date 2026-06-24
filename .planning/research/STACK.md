# Technology Stack — дополнения для бэклога

**Проект:** Электронный дневник медресе (Quran study journal)  
**Режим:** Brownfield — только **новые** библиотеки и паттерны поверх Next.js 16 + Prisma 7 + PostgreSQL  
**Исследовано:** 2026-06-24  
**Базовый стек:** см. `.planning/codebase/STACK.md` (не дублируется)

---

## Резюме рекомендаций

| Область | Новые npm-пакеты | Основной паттерн | Уверенность |
|---------|------------------|------------------|-------------|
| Таймер урока | **нет** | Zustand + Prisma-поля на `Session` | HIGH |
| Аудит | **нет** (опц. `isomorphic-dompurify` для XSS) | Prisma `AuditEvent` + `after()` | HIGH |
| Уведомления | активировать `sonner` (уже в lockfile) | Prisma + React Query polling + Ant Design | HIGH |
| Отпуска/замещения | **нет** | Prisma + date-fns + HTTP cron | HIGH |
| Idle timeout | `react-idle-timer` ^5.7.3 | Клиент idle → `signOut` + `maxAge` JWT | HIGH |
| Rate limit (безопасность) | `@upstash/ratelimit` ^2.0.8 + `@upstash/redis` ^1.36 | Sliding window на login | MEDIUM |

**Принцип brownfield:** максимум доменной логики в Prisma + server actions; новые npm — только там, где экосистема даёт проверенное решение (idle detection, distributed rate limit), а не «обёртка над одной функцией».

---

## Рекомендуемые дополнения

### 1. Таймер урока (ручной старт/завершение)

| Технология | Версия | Назначение | Почему |
|------------|--------|------------|--------|
| *(существующий)* Zustand | 5.0.14 | Клиентское состояние «урок идёт», elapsed display | Уже в `journal-store`; расширить, не плодить store |
| *(существующий)* date-fns | 4.1.0 | `differenceInSeconds`, `intervalToDuration`, агрегации | Уже в аналитике; единый date-стек |
| *(существующий)* Ant Design | 6.4.3 | `Button`, `Statistic`, `Tag` для UI таймера | Консистентность с журналом |
| Prisma schema | — | `Session.startedAt`, `Session.endedAt`, `Session.durationSeconds` | Источник истины — БД; клиент только отображает |

**Паттерн:**

```
Журнал (client)                    Server
─────────────────────────────────────────────────
[Начать урок] ──server action──► UPDATE Session.startedAt
Zustand: isLessonActive=true      (или create draft session)
setInterval display elapsed       JWT teacherId ownership check

[Завершить] ──server action──► endedAt + durationSeconds
Zustand reset                     recalculate analytics aggregates
```

- **Клиентский elapsed:** `Date.now() - startedAt` или `performance.now()` — без `setInterval`-библиотек.
- **Сохранение:** расширить `src/features/journal/actions/journal-actions.ts` и/или `POST /api/sessions` — не отдельный REST-фреймворк.
- **Синхронизация вкладок:** при возврате на страницу — refetch session из server action (React Query optional для lesson state).

**Не использовать:**

| Пакет | Причина отказа |
|-------|----------------|
| `react-timer-hook`, `usehooks-ts` useInterval | Одна строка `setInterval` + cleanup в `useEffect` |
| `moment` / `dayjs` для длительности | `date-fns` уже в проекте |
| Отдельный Web Worker для таймера | Нет требования точности sub-second |

**Уверенность:** HIGH — паттерн «server timestamp + client display» стандартен для LMS без real-time.

---

### 2. Журнал аудита

| Технология | Версия | Назначение | Почему |
|------------|--------|------------|--------|
| Prisma model `AuditEvent` | — | Append-only события | FSD-совместимо; фильтры в SQL |
| Next.js `after()` | 16.1.6 (built-in) | Неблокирующая запись аудита после ответа | [Официальная документация Next.js 16](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/04-functions/after.mdx) |
| `isomorphic-dompurify` | ^3.16.0 | Санитизация HTML шагов (смежная безопасность) | Node 22 + ESM; закрывает XSS в `BlockRenderer` |

**Схема события (минимум для бэклога):**

```prisma
model AuditEvent {
  id           String   @id @default(cuid())
  occurredAt   DateTime @default(now())
  actorUserId  String?
  actorRole    Role?
  action       String   // "student.teacher_changed", "auth.login", ...
  category     String   // "student" | "auth" | "leave" | ...
  resourceType String?
  resourceId   String?
  metadata     Json?
  ipAddress    String?
  userAgent    String?

  @@index([occurredAt])
  @@index([category, action])
  @@index([resourceType, resourceId])
  @@index([actorUserId])
}
```

**Паттерн записи:**

```typescript
// src/shared/lib/audit/log-audit-event.ts
import { after } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/shared/lib/prisma'

export function logAuditEvent(event: AuditEventInput) {
  after(async () => {
    const h = await headers()
    await prisma.auditEvent.create({
      data: {
        ...event,
        ipAddress: h.get('x-forwarded-for')?.split(',')[0] ?? null,
        userAgent: h.get('user-agent'),
      },
    })
  })
}
```

- Вызывать из server actions **после** успешной бизнес-операции (смена преподавателя, замещение, login/logout).
- Для критичных событий (impersonation) — **await** вместо `after()`, чтобы не потерять запись при shutdown контейнера.
- Фаза 3 hardening: raw SQL migration с PostgreSQL `BEFORE UPDATE OR DELETE` trigger — immutability на уровне БД ([паттерн append-only audit](https://michaeldishmon.com/writing/audit-logging-healthcare-nextjs), MEDIUM confidence для отдельного DB role).

**Не использовать:**

| Пакет | Причина отказа |
|-------|----------------|
| `prisma-extension-audit`, `audit-logger` npm | Не вписываются в FSD; слабая кастомизация под русские категории |
| Elasticsearch / Loki для v1 | Масштаб медресе — PostgreSQL + индексы достаточны |
| Запись аудита в той же `$transaction` что и бизнес-данные | При rollback бизнес-операции аудит тоже откатится — плохо для forensic |

**Уверенность:** HIGH для Prisma + `after()`; MEDIUM для DB-level immutability (нужна ops-договорённость о втором DB role).

---

### 3. Уведомления (колокольчик, без чата в v1)

| Технология | Версия | Назначение | Почему |
|------------|--------|------------|--------|
| Prisma model `Notification` | — | `userId`, `type`, `title`, `body`, `readAt`, `payload` JSON | Персистентность, фильтр непрочитанных |
| `@tanstack/react-query` | 5.90.21 (есть) | `useQuery` + `refetchInterval: 30_000` | Self-hosted Docker; polling устойчивее SSE на Coolify |
| Ant Design `Badge` + `Dropdown` + `List` | 6.4.3 (есть) | UI колокольчика в header | Нулевые новые UI-зависимости |
| `sonner` | ^2.0.7 (есть, не импортируется) | Toast при появлении новых | Уже в `package.json`; подключить в layout |

**Паттерн доставки:**

```
Мутация (server action) ──► prisma.notification.create (target userIds)
                                    │
React Query poll GET /api/notifications ──► Badge count
                                    │
sonner toast (если count вырос) ◄───┘
```

- **Интервал polling:** 30 с для badge; 0 при неактивной вкладке (`refetchIntervalInBackground: false` — уже дефолт React Query).
- **Создание уведомлений:** в server actions фаз 2–3 (смена преподавателя, одобрение отпуска, превышение норматива 48 ч) — через `after()` или inline create.
- **markAsRead:** server action + optimistic update в React Query.

**Не использовать (v1):**

| Технология | Причина отказа |
|------------|----------------|
| Pusher / Ably / Socket.io | Чат отложен; частота событий < 1/мин; лишняя инфраструктура |
| SSE Route Handler | Работает на self-hosted, но polling проще и дешевле для badge ([decision matrix 2026](https://wolf-tech.io/blog/nextjs-15-sse-vs-websockets-vs-polling-real-time-decision-matrix-2026), MEDIUM) |
| Firebase FCM / email (Resend) | Out of scope PROJECT.md — только in-app |
| Novu / Knock | Over-engineering для ~десятков пользователей |

**Фаза 3 (чат):** пересмотреть SSE или managed WebSocket — отдельное исследование.

**Уверенность:** HIGH для polling + Prisma; MEDIUM для выбора 30 с vs 60 с интервала (нагрузка negligible).

---

### 4. Отпуска, заявки, авто-замещение

| Технология | Версия | Назначение | Почему |
|------------|--------|------------|--------|
| Prisma models | — | `LeaveRequest`, `TeacherSubstitution` | Доменная модель; связь teacher ↔ substitute ↔ date range |
| `date-fns` | 4.1.0 (есть) | `areIntervalsOverlapping`, `eachDayOfInterval` | Проверка пересечений отпусков |
| Ant Design `DatePicker.RangePicker` + `Calendar` | 6.4.3 (есть) | Форма заявки, календарь менеджера | `dayjs` уже для DatePicker |
| HTTP cron endpoint | built-in | `GET /api/internal/cron/process-leaves` + `CRON_SECRET` | Docker/Coolify scheduled task; без процесса node-cron в `next start` |

**Паттерн замещения:**

```
LeaveRequest (PENDING) ──manager approve──► APPROVED
       │                                      │
       │                              TeacherSubstitution.create
       │                              (substituteId, from, to, reason)
       ▼
Cron (ежедневно 00:05 MSK) ──► activate/deactivate substitutions
       │                              │
       ▼                              ▼
auth: effective teacherId     notification → substitute teacher
```

- **Проверка «чужой учётки»:** расширить JWT/session callback — `effectiveTeacherId` из активного `TeacherSubstitution`, не отдельная auth-библиотека.
- **Cron:** Coolify HTTP scheduler → route handler с `Authorization: Bearer ${CRON_SECRET}`; **не** `node-cron` внутри Next.js (хрупко при scale-out).

**Не использовать:**

| Пакет | Причина отказа |
|-------|----------------|
| `react-big-calendar`, FullCalendar | Ant Design Calendar достаточен для менеджерского обзора |
| `rrule` | Нет требования повторяющихся отпусков в v1 |
| Temporal.io / BullMQ | Batch из 1 cron-запроса в день |

**Уверенность:** HIGH для Prisma + date-fns + HTTP cron на текущем деплое (Coolify/Docker).

---

### 5. Idle session timeout (1 час бездействия)

| Технология | Версия | Назначение | Почему |
|------------|--------|------------|--------|
| `react-idle-timer` | ^5.7.3 | Детекция idle на клиенте | 1.3M weekly downloads, 0 deps, [idletimer.dev](https://idletimer.dev) |
| NextAuth `session.maxAge` | 5.0.0-beta.30 (есть) | Серверный потолок сессии | Backstop если клиент не сработал |
| Prisma `AuditEvent` | — | `auth.logout_idle`, `auth.login` | Требование логирования входов/выходов |

**Конфигурация:**

```typescript
// auth.config.ts — дополнение
session: {
  strategy: 'jwt',
  maxAge: 60 * 60, // 1 час абсолютный потолок (или sync с idle)
},
```

```tsx
// src/features/auth/ui/IdleSessionGuard.tsx ('use client')
import { useIdleTimer } from 'react-idle-timer'
import { signOut } from 'next-auth/react'

const IDLE_MS = 60 * 60 * 1000
const PROMPT_MS = 5 * 60 * 1000 // опционально: предупреждение за 5 мин

useIdleTimer({
  timeout: IDLE_MS,
  promptTimeout: PROMPT_MS,
  onPrompt: () => setShowWarning(true),
  onIdle: () => signOut({ callbackUrl: '/login?reason=idle' }),
  debounce: 500,
  events: ['mousedown', 'keydown', 'touchstart', 'scroll'],
})
```

- Обернуть `(dashboard)` layout, **исключить** `/login`.
- **Не** продлевать JWT при активности — требование «автовыход после 1ч бездействия», не sliding 24h session.
- Server action `logAuditEvent` на login (`login-actions.ts`) и при `signOut` (через API route `POST /api/auth/logout-audit` если нужен IP).

**Не использовать:**

| Подход | Причина отказа |
|--------|----------------|
| Только `maxAge` без клиента | JWT cookie может жить дольше UI-состояния; вкладка в фоне «оживляет» сессию при refetch |
| Кастомный `mousemove` listener | `react-idle-timer` покрывает edge cases (throttle, cross-tab, visibility) |
| Database sessions NextAuth | Избыточная миграция; JWT + idle guard достаточны для v1 |

**Уверенность:** HIGH — [community pattern NextAuth + react-idle-timer](https://stackoverflow.com/questions/71362702) подтверждён множественными источниками.

---

### 6. Безопасность (смежно с фазой 2 — rate limit, API auth)

| Технология | Версия | Назначение | Почему |
|------------|--------|------------|--------|
| `@upstash/ratelimit` | ^2.0.8 | Sliding window на login | GA, HTTP Redis, работает в server actions ([releases Jan 2026](https://github.com/upstash/ratelimit-js/releases/tag/v2.0.8)) |
| `@upstash/redis` | ^1.36.0 | Backend для ratelimit | Пара к ratelimit; free tier 10k req/day |
| `isomorphic-dompurify` | ^3.16.0 | Санитизация `Step.content` при save | Закрывает stored XSS (CONCERNS.md) |

**Альтернатива без Redis (single Docker instance):**

| Технология | Версия | Когда |
|------------|--------|-------|
| In-memory `Map` + TTL в `login-actions.ts` | — | Один контейнер, нет Upstash; сброс при redeploy |
| PostgreSQL table `RateLimitBucket` | — | Zero new infra; чуть больше кода |

**Рекомендация:** Upstash если допустима внешняя зависимость; иначе PG bucket — не in-memory (теряется при restart и не shared).

**Паттерн API auth (без npm):** `src/shared/lib/authorize-api.ts` + default-deny wrapper для `src/app/api/**` — закрывает CONCERNS.md.

**Уверенность:** MEDIUM для Upstash (зависит от политики внешних сервисов); HIGH для isomorphic-dompurify и shared authorize helper.

---

## Сводная таблица новых npm-зависимостей

### Установить

```bash
# Обязательные для бэклога
pnpm add react-idle-timer@^5.7.3

# Безопасность (фаза 2)
pnpm add @upstash/ratelimit@^2.0.8 @upstash/redis@^1.36.0 isomorphic-dompurify@^3.16.0
```

### Активировать из существующих (без install)

| Пакет | Действие |
|-------|----------|
| `sonner` | `<Toaster />` в `src/app/layout.tsx` |
| `date-fns` | overlap-утилиты для отпусков |
| `@tanstack/react-query` | notification polling hook |

### Явно не добавлять

| Категория | Пакеты |
|-----------|--------|
| Real-time | `socket.io`, `pusher`, `ably` |
| Job queue | `bullmq`, `node-cron`, `agenda` |
| Audit SaaS | `audit-logger`, elastic clients |
| Calendar | `react-big-calendar`, `@fullcalendar/*` |
| Timer | `react-timer-hook`, `moment` |
| Auth/RBAC | `@casl/ability` (есть `requireRole`) |
| Notifications SaaS | `novu`, `@knocklabs/node` |

---

## Соответствие FSD и существующим паттернам

| Новая фича | Слой FSD | Существующий паттерн для копирования |
|------------|----------|--------------------------------------|
| Таймер урока | `features/journal/` | `journal-store.ts`, `journal-actions.ts` |
| Аудит | `shared/lib/audit/` | как `requireRole` в `shared/lib/session.ts` |
| Уведомления | `features/notifications/` | `features/analytics/` + React Query |
| Отпуска | `features/leave-management/` | `features/groups/actions/` |
| Idle guard | `features/auth/ui/` | `LoginForm.tsx`, providers в `shared/providers/` |
| Cron | `app/api/internal/cron/` | `src/app/api/sessions/route.ts` |

**Server Actions vs API:** мутации — server actions (как сейчас); read для polling уведомлений — thin `GET /api/notifications` (как `students`, `sessions`).

---

## Переменные окружения (новые)

| Переменная | Фаза | Назначение |
|------------|------|------------|
| `UPSTASH_REDIS_REST_URL` | 2 | Rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | 2 | Rate limit |
| `CRON_SECRET` | 2 | Защита cron route для отпусков |
| `SESSION_IDLE_MINUTES` | 2 | Override дефолта 60 (опционально) |

---

## Альтернативы

| Категория | Рекомендация | Альтернатива | Почему не альтернатива |
|-----------|--------------|--------------|------------------------|
| Idle detection | `react-idle-timer` | Custom hook | Больше edge-case багов; нет выигрыша в bundle |
| Rate limit | Upstash | `express-rate-limit` | Нет Express; server actions |
| Notifications transport | Polling 30s | SSE | Избыточно для badge; chat — позже |
| Audit storage | PostgreSQL | ClickHouse | Объём данных медресе << 1M rows/year |
| Cron | HTTP + Coolify | `node-cron` in process | Не масштабируется; дубли при 2+ replicas |

---

## Оценка уверенности

| Область | Уровень | Обоснование |
|---------|---------|-------------|
| Таймер урока (без npm) | HIGH | Существующий Zustand + Session model; стандарт LMS |
| Аудит (Prisma + after) | HIGH | Next.js 16 docs + brownfield Prisma patterns |
| Уведомления (poll + sonner) | HIGH | Self-hosted Docker; низкая частота событий |
| Отпуска (date-fns + cron) | HIGH | Ant Design + date-fns уже в проекте |
| Idle timeout | HIGH | react-idle-timer + NextAuth maxAge — проверенная связка |
| Upstash rate limit | MEDIUM | Зависит от допустимости внешнего Redis; есть PG fallback |
| DB immutability audit | MEDIUM | Требует DBA/migration; не блокер MVP |

---

## Источники

- [Next.js 16 `after()` — official](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/04-functions/after.mdx) — HIGH
- [Next.js 16 instrumentation](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/03-file-conventions/instrumentation.mdx) — HIGH
- [Upstash Ratelimit v2.0.8 release](https://github.com/upstash/ratelimit-js/releases/tag/v2.0.8) — HIGH
- [react-idle-timer npm](https://www.npmjs.com/package/react-idle-timer) — HIGH
- [isomorphic-dompurify v3](https://github.com/kkomelin/isomorphic-dompurify/releases/tag/3.0.0) — HIGH
- [SSE vs polling decision matrix 2026](https://wolf-tech.io/blog/nextjs-15-sse-vs-websockets-vs-polling-real-time-decision-matrix-2026) — MEDIUM
- [Audit logging Next.js + Postgres](https://michaeldishmon.com/writing/audit-logging-healthcare-nextjs) — MEDIUM
- Кодовая база: `.planning/codebase/STACK.md`, `prisma/schema.prisma`, `auth.config.ts`, `journal-store.ts` — HIGH

---

*Stack research (backlog additions): 2026-06-24*
