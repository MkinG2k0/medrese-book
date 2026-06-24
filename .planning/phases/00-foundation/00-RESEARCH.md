# Phase 0: Foundation — Research

**Researched:** 2026-06-24  
**Domain:** Техническая база brownfield LMS — фильтры аналитики, API auth, student-progress, domain-events  
**Confidence:** HIGH (кодовая база проверена напрямую; архитектурные рекомендации согласованы с `.planning/research/ARCHITECTURE.md`)

## Summary

Фаза 0 закрывает четыре системных долга, блокирующих достоверную аналитику и безопасное расширение API. Сейчас метрики в `src/shared/lib/analytics.ts` включают все `Session` и `StepCompletion` без фильтрации; синтетические сессии создаются в `syncCompletionsForProgress()` с note «Корректировка прогресса» [VERIFIED: `src/shared/lib/sync-completions-for-progress.ts`]; признака «зачтено ранее» в схеме Prisma нет [VERIFIED: `prisma/schema.prisma`]. API-маршруты защищены ad hoc через `auth()` с разной логикой; `middleware.ts` исключает весь `/api/*` кроме `/api/auth` [VERIFIED: `middleware.ts`, CONCERNS.md]. Логика прогресса размазана по 5+ файлам; `dispatchDomainEvent` отсутствует [VERIFIED: grep по `src/`].

**Primary recommendation:** Одна Prisma-миграция (`isAdjustment` + `isPriorCredit` + backfill) → централизовать прогресс в `src/shared/lib/student-progress/` → единые фильтры в `src/shared/lib/analytics-queries/` → `authorizeApiRequest()` с матрицей default-deny на всех 5 REST handlers → `dispatchDomainEvent()` + модель `AuditEvent` с no-op notification handler до фазы 6.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Единый фильтр аналитики исключает сессии-корректировки и шаги «зачтено ранее» | Prisma-флаги + `analytics-queries/filters.ts` + backfill; все потребители через один слой |
| FND-02 | Общий `authorizeApiRequest()` для всех API routes с default-deny | Матрица ролей/ресурсов; рефактор 5 route handlers; E2E на cross-group/cross-student |
| FND-03 | Централизованный модуль `student-progress` для пересчёта `currentStepIdx` и prior credit | Консолидация `recalculate-step-progress.ts`, `sync-completions-for-progress.ts`, `step-offset.ts` |
| FND-04 | `dispatchDomainEvent` для fan-out в audit и notifications без cross-feature imports | `shared/lib/domain-events/` + `AuditEvent`; stub notifications; вызов из критических мутаций |

</phase_requirements>

## Project Constraints (from .cursor/rules/)

| Источник | Директива | Влияние на фазу 0 |
|----------|-----------|-------------------|
| `.cursor/rules/new-module-tests.mdc` | Новый API-флоу → Playwright-тесты в `e2e/` в том же PR | Добавить `e2e/api-auth.spec.ts` (FND-02), тесты фильтров (FND-01) |
| `CLAUDE.md` | Сохранить Next.js 16 + Prisma + PostgreSQL + FSD | Без смены стека; новый код в `src/shared/lib/` |
| `CLAUDE.md` | Не ломать существующие sessions/completions | Миграция additive + data backfill, не delete |
| FSD layer rules (`eslint.config.mjs`) | `shared` не импортирует `features` | domain-events, student-progress, authorize — только в `shared/` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, API routes, middleware | Уже в проекте [VERIFIED: `package.json`] |
| next-auth | 5.0.0-beta.30 | JWT-сессии, `auth()` в handlers | Единственный auth-слой [VERIFIED: `src/shared/lib/auth.ts`] |
| @prisma/client | 7.8.0 | ORM, миграции | Схема в `prisma/schema.prisma` [VERIFIED: `package.json`] |
| zod | 4.3.6 | Валидация API bodies | Паттерн всех route handlers [VERIFIED: `src/app/api/*`] |
| @playwright/test | 1.61.0 | E2E + API request tests | Единственный test runner [VERIFIED: `package.json`, `playwright.config.ts`] |
| date-fns | 4.1.0 | Диапазоны месяца в аналитике | Уже в `analytics.ts` [VERIFIED] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | — (отсутствует) | Unit-тесты pure functions | Wave 0: опционально для `filters.ts`, `offsets.ts` (<30s feedback) |
| @tanstack/react-query | 5.90.21 | Клиентские API-вызовы | Без изменений; consumers фильтров на сервере |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `isAdjustment` / `isPriorCredit` boolean flags | Фильтр по `note = 'Корректировка прогресса'` | Хрупко при смене текста; не покрывает prior credit без note |
| Отдельная таблица `ProgressAdjustment` | Boolean на Session | Больше JOIN-ов; избыточно для текущего масштаба [CITED: `.planning/research/PITFALLS.md`] |
| Middleware-only API auth | Только `authorizeApiRequest()` per route | Middleware не видит `studentId`/`groupId` из query — resource checks невозможны на edge |
| Event bus (Redis/NATS) | In-process `dispatchDomainEvent` | Over-engineering для monolith; notifications — polling в v1 [CITED: `.planning/research/ARCHITECTURE.md`] |

**Installation (Wave 0, опционально):**

```bash
pnpm add -D vitest @vitest/coverage-v8
```

**Version verification:** Версии взяты из `package.json` проекта (2026-06-24). Отдельный `npm view` не требовался — lockfile присутствует.

## Architecture Patterns

### Recommended Project Structure

```
src/shared/lib/
├── student-progress/           # FND-03 — единый домен прогресса
│   ├── index.ts                # публичный API модуля
│   ├── recalculate.ts          # из recalculate-step-progress.ts
│   ├── sync-for-progress.ts    # из sync-completions-for-progress.ts
│   ├── offsets.ts              # из step-offset.ts (+ кэш getLevelStepOffsets)
│   ├── filters.ts              # isRealLessonSession, isCountableCompletion
│   └── types.ts
├── analytics-queries/          # FND-01 — агрегаты с обязательными фильтрами
│   ├── index.ts
│   ├── filters.ts              # Prisma where-фрагменты (единственный источник)
│   ├── top-students.ts         # из analytics.ts
│   └── level-stats.ts
├── authorize-api-request.ts    # FND-02 — default-deny gate
└── domain-events/              # FND-04
    ├── dispatch.ts
    ├── types.ts                # DomainEvent union
    ├── handlers/
    │   ├── audit.ts            # writeAuditEvent
    │   └── notifications.ts    # no-op stub до Phase 6
    └── index.ts

src/shared/lib/audit/
└── write-audit-event.ts        # только из domain-events handler

prisma/schema.prisma              # + isAdjustment, isPriorCredit, AuditEvent
```

Старые файлы (`recalculate-step-progress.ts`, `sync-completions-for-progress.ts`, `step-offset.ts`, `analytics.ts`) — **re-export** на переходный период или удалить после обновления импортов (планировщик решает в одном wave).

### Pattern 1: Единые фильтры аналитики (FND-01)

**What:** Все метрики проходят через `analytics-queries/filters.ts`; запрет прямых Prisma-запросов sessions/completions для отчётов вне этого слоя.

**When to use:** Любой подсчёт шагов, посещаемости, средних оценок за период.

**Example:**

```typescript
// src/shared/lib/analytics-queries/filters.ts
// Source: [VERIFIED: codebase + .planning/research/ARCHITECTURE.md]

export const countableSessionWhere = { isAdjustment: false } as const

export const countableCompletionWhere = { isPriorCredit: false } as const

/** Для include/wheres в аналитике */
export function analyticsCompletionFilter(dateRange: { gte: Date; lte: Date }) {
  return {
    createdAt: dateRange,
    isPriorCredit: false,
  }
}

export function analyticsSessionFilter(dateRange: { gte: Date; lte: Date }) {
  return {
    date: dateRange,
    isAdjustment: false,
  }
}
```

**Проставление флагов при записи:**

```typescript
// sync-for-progress.ts — при создании adjustment session
await tx.session.create({
  data: {
    studentId,
    date: toSessionDate(today),
    attendance: 'PRESENT',
    note: 'Корректировка прогресса',
    isAdjustment: true,  // NEW
  },
})

// completions от admin backfill
await tx.stepCompletion.create({
  data: {
    studentId,
    stepId,
    sessionId: adjustmentSession.id,
    grade: PASSING_GRADE,
    isPriorCredit: true,  // NEW — «зачтено ранее»
  },
})

// POST /api/sessions — обычный урок
// isAdjustment: false (default), isPriorCredit: false (default)
```

### Pattern 2: `authorizeApiRequest()` default-deny (FND-02)

**What:** Один вход для всех API handlers: аутентификация → проверка роли → проверка владения ресурсом. Без явного разрешения — `403`.

**When to use:** Первой строкой каждого handler в `src/app/api/**/route.ts` (кроме `api/auth`).

**Example:**

```typescript
// src/shared/lib/authorize-api-request.ts
// Source: [VERIFIED: patterns from authorize-student.ts, group-access.ts, CONCERNS.md]

import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { forbidden, unauthorized } from '@/shared/api'
import type { Role } from '@/shared/lib/prisma'

type ApiAuthContext = {
  groupId?: string | null
  studentId?: string | null
  completionId?: string | null
}

type AuthorizeOptions = {
  /** Если пусто — любая аутентифицированная роль (редко) */
  allowedRoles?: Role[]
  context?: ApiAuthContext
}

export async function authorizeApiRequest(options: AuthorizeOptions = {}) {
  const session = await auth()
  if (!session?.user) return { error: unauthorized() } as const

  const { role, teacherId, studentId: actorStudentId } = session.user

  if (options.allowedRoles && !options.allowedRoles.includes(role)) {
    return { error: forbidden() } as const
  }

  const ctx = options.context ?? {}

  // STUDENT: только свои studentId / своя group
  if (role === 'STUDENT') {
    if (ctx.studentId && ctx.studentId !== actorStudentId) {
      return { error: forbidden() } as const
    }
    if (ctx.groupId) {
      const own = await prisma.student.findUnique({
        where: { id: actorStudentId! },
        select: { groupId: true },
      })
      if (!own || own.groupId !== ctx.groupId) return { error: forbidden() } as const
    }
  }

  // TEACHER: только ученики своей группы
  if (role === 'TEACHER' && ctx.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: ctx.studentId },
      include: { group: true },
    })
    if (!student || student.group.teacherId !== teacherId) {
      return { error: forbidden() } as const
    }
  }

  if (role === 'TEACHER' && ctx.groupId) {
    const group = await prisma.group.findUnique({ where: { id: ctx.groupId } })
    if (!group || group.teacherId !== teacherId) return { error: forbidden() } as const
  }

  return { session } as const
}
```

**Матрица доступа (default-deny)** [VERIFIED: audit `src/app/api/*` + CONCERNS.md]:

| Route | Method | MANAGER / SUPER_ADMIN | TEACHER | STUDENT |
|-------|--------|----------------------|---------|---------|
| `/api/students` | GET | ✓ любая группа | ✓ своя группа | ✓ только своя группа |
| `/api/sessions` | GET | ✓ | ✓ свой ученик | ✓ только `studentId=self` |
| `/api/sessions` | POST | ✗ | ✓ свой ученик | ✗ |
| `/api/step-completions` | GET/DELETE | ✗ (или ✓ Phase 2+) | ✓ свой ученик | ✗ |
| `/api/step-completions/[id]` | PATCH | ✗ | ✓ свой completion | ✗ |
| `/api/uploads` | POST | ✓ | ✗ | ✗ |

**Решение по middleware** (blocker из STATE.md): **двухслойная защита** [RECOMMENDED]:
1. Расширить `middleware.ts` matcher: требовать сессию для `/api/*` (кроме `/api/auth`) — закрывает unauthenticated на edge.
2. Resource-level — только `authorizeApiRequest()` в handler (middleware не видит query/body).

Альтернатива «только per-route» допустима как MVP, но слабее против забытых `auth()` в новых routes.

### Pattern 3: Централизованный student-progress (FND-03)

**What:** Единственная точка пересчёта `currentStepIdx`, синхронизации prior credit и level auto-advance.

**Публичный API модуля:**

```typescript
// src/shared/lib/student-progress/index.ts
export { recalculateStudentStepIdx } from './recalculate'
export { syncCompletionsForProgress } from './sync-for-progress'
export {
  getStepOffsetForLevel,
  getLevelStepOffsets,
  getLocalStepIdx,
  toGlobalStepNumber,
} from './offsets'
export {
  isCountableCompletion,
  isRealLessonSession,
} from './filters'
```

**Call sites для обновления импортов** [VERIFIED: grep]:
- `src/app/api/sessions/route.ts`
- `src/app/api/step-completions/route.ts`, `[id]/route.ts`
- `src/features/journal/actions/journal-actions.ts`
- `src/features/student-admin/actions/student-admin-actions.ts`
- `src/features/user-admin/actions/user-actions.ts`
- `src/features/student-portal/actions/student-actions.ts`

**Согласованность журнал / портал / аналитика:** после `updateStudentProgress` и `POST /api/sessions` всегда вызывать `recalculateStudentStepIdx`; убрать defensive recalculate на read-path в `getStudentLesson()` (опционально в этой фазе или Phase 1 — см. Open Questions).

### Pattern 4: Domain events (FND-04)

**What:** После успешной мутации — `dispatchDomainEvent(event, tx?)` fan-out в audit (+ notifications stub).

**Example:**

```typescript
// src/shared/lib/domain-events/dispatch.ts
import type { Prisma } from '@/shared/lib/prisma'
import { writeAuditEvent } from '@/shared/lib/audit/write-audit-event'
import { enqueueNotifications } from './handlers/notifications'
import type { DomainEvent } from './types'

export async function dispatchDomainEvent(
  event: DomainEvent,
  tx?: Prisma.TransactionClient,
) {
  await writeAuditEvent(event, tx)
  await enqueueNotifications(event, tx) // no-op до Phase 6
}
```

**Prisma model (минимум Phase 0):**

```prisma
model AuditEvent {
  id         String   @id @default(cuid())
  actorId    String
  action     String   // e.g. STUDENT_PROGRESS_CHANGED
  entityType String   // Student | Session | StepCompletion
  entityId   String
  payload    Json
  createdAt  DateTime @default(now())

  @@index([createdAt])
  @@index([entityType, entityId])
}
```

**Мутации для подключения в Phase 0** (критические, уже существуют):
- `updateStudentProgress` → `STUDENT_PROGRESS_CHANGED`
- `createUsers` / `updateUser` (student branch) → `STUDENT_CREATED` / `STUDENT_UPDATED`
- `POST /api/sessions` → `SESSION_SAVED`
- `DELETE /api/step-completions`, `PATCH .../[id]` → `COMPLETION_CHANGED`

UI аудита (`features/audit-log`) — **Phase 7**; в Phase 0 достаточно write path + проверка записей в БД тестом.

### Anti-Patterns to Avoid

- **Фильтр по тексту note:** `note contains 'Корректировка'` — ломается при локализации/редактировании.
- **Дублирование auth в каждом handler:** оставлять raw `if (session.user.role !== 'TEACHER')` вместо матрицы.
- **Feature → feature imports для audit:** `student-admin` не должен импортировать `audit-log`; только `dispatchDomainEvent`.
- **Пересчёт прогресса в UI:** `currentStepIdx` только на сервере через `student-progress`.
- **deleteMany completions без события:** теряется audit trail (существующий долг — не усугублять).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API auth matrix | Свой RBAC-фреймворк | `authorizeApiRequest()` + NextAuth session | 5 routes, 4 роли — достаточно typed helper |
| Analytics filtering | Copy-paste `where` в каждый query | `analytics-queries/filters.ts` | Единственный источник для FND-01 и ANLY-10 |
| Event bus | Redis/RabbitMQ | In-process `dispatchDomainEvent` | Monolith, polling notifications в v1 |
| Progress offset cache | Redis | `getLevelStepOffsets()` in-memory per request | Уже есть helper [VERIFIED: `step-offset.ts`] |
| Audit immutability | Append-only file log | Prisma `AuditEvent` + domain-events | Query/filter в Phase 7 |

**Key insight:** Phase 0 — **инфраструктурные примитивы**, не пользовательские экраны. Все четыре требования — `shared/lib` + Prisma + рефактор существующих call sites.

## Common Pitfalls

### Pitfall 1: Миграция без backfill

**What goes wrong:** Новые флаги `false` по умолчанию — старые adjustment-сессии остаются в метриках.

**Why it happens:** Additive migration без `UPDATE` существующих строк.

**How to avoid:** Data migration SQL в той же миграции:
```sql
UPDATE "Session" SET "isAdjustment" = true WHERE note = 'Корректировка прогресса';
UPDATE "StepCompletion" sc SET "isPriorCredit" = true
  FROM "Session" s WHERE sc."sessionId" = s.id AND s."isAdjustment" = true;
```

**Warning signs:** После деплоя метрики не изменились при наличии adjustment-данных в seed.

### Pitfall 2: GET /api/sessions без date остаётся открытым

**What goes wrong:** STUDENT читает 30 сессий чужого ученика [VERIFIED: CONCERNS.md known bug].

**Why it happens:** Auth check только при наличии `date` param.

**How to avoid:** `authorizeApiRequest({ context: { studentId } })` **до** ветвления по `date`; STUDENT — always self only.

**Warning signs:** E2E: student token + чужой `studentId` → не 403.

### Pitfall 3: Расхождение прогресса после admin edit

**What goes wrong:** Журнал показывает шаг N, портал — N-1, аналитика считает иначе.

**Why it happens:** `syncCompletionsForProgress` и `recalculateStudentStepIdx` вызываются не атомарно или не из одного модуля.

**How to avoid:** Один `$transaction`: sync → update student → recalculate → `dispatchDomainEvent`.

### Pitfall 4: Domain event до commit

**What goes wrong:** Audit записан, транзакция откатилась — фантомные события.

**How to avoid:** Передавать `tx` в `dispatchDomainEvent` / `writeAuditEvent` внутри той же `$transaction`.

### Pitfall 5: FSD violation

**What goes wrong:** `features/audit-log` импортируется из `student-admin`.

**How to avoid:** Только `shared/lib/domain-events` как зависимость для features.

## Code Examples

### Prisma schema changes

```prisma
// Source: [CITED: .planning/research/ARCHITECTURE.md Migration 1]

model Session {
  // ...existing fields
  isAdjustment Boolean @default(false)
}

model StepCompletion {
  // ...existing fields
  isPriorCredit Boolean @default(false)
}
```

### Refactored analytics query

```typescript
// src/shared/lib/analytics-queries/top-students.ts
import { analyticsCompletionFilter, analyticsSessionFilter } from './filters'

// В findMany include:
completions: { where: analyticsCompletionFilter({ gte: from, lte: to }) },
sessions: { where: analyticsSessionFilter({ gte: from, lte: to }) },
```

### API handler skeleton

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return error('groupId обязателен')

  const authResult = await authorizeApiRequest({
    allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
    context: { groupId },
  })
  if ('error' in authResult && authResult.error) return authResult.error

  // ... business logic
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Note-based adjustment detection | `Session.isAdjustment` boolean | Phase 0 (planned) | Надёжная фильтрация аналитики |
| Нет prior credit marker | `StepCompletion.isPriorCredit` | Phase 0 (planned) | ANLY-10 готов без переделки |
| Ad hoc `auth()` per route | `authorizeApiRequest()` + optional middleware | Phase 0 | Default-deny, тестируемая матрица |
| Разрозненные progress libs | `shared/lib/student-progress/` | Phase 0 | Один call graph |
| Нет audit | `dispatchDomainEvent` → `AuditEvent` | Phase 0 write; Phase 7 UI | Accountability |

**Deprecated/outdated:**
- Прямые импорты из `recalculate-step-progress.ts` — заменить на `student-progress`
- Подсчёт метрик вне `analytics-queries/` — запретить для новых отчётов

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Middleware auth gate для `/api/*` совместим с NextAuth 5 beta matcher | Pattern 2 | Двойной redirect или broken API clients |
| A2 | Все completions из `syncCompletionsForProgress` = prior credit | Pattern 1 | Завышение/занижение метрик реальных уроков |
| A3 | `enqueueNotifications` no-op приемлем до Phase 6 | Pattern 4 | FND-04 формально выполнен только audit path |
| A4 | Vitest опционален; Playwright API tests достаточны для gate | Validation | Медленнее feedback на pure functions |

## Open Questions (RESOLVED)

1. **Middleware для `/api/*` — в Phase 0 или отдельным plan?** — **RESOLVED:** включён в Plan 03 (authentication-only gate) + per-route `authorizeApiRequest`.
2. **Убрать `recalculateStudentStepIdx` из `getStudentLesson()` read path?** — **RESOLVED:** отложено в Phase 1; Plan 04 фокусируется на write-path consistency.
3. **MANAGER доступ к step-completions API?** — **RESOLVED:** TEACHER-only (default-deny) до Phase 2; зафиксировано в Plan 03.
4. **Seed sessions с note «Seed data» — помечать isAdjustment?** — **RESOLVED:** `isAdjustment: false` для demo lessons; backfill только по note «Корректировка прогресса» (Plan 02).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, dev, tests | ✓ | 22.22.0 | — |
| pnpm | package manager | ✓ | 10.32.1 | npm (не рекомендуется) |
| PostgreSQL | Prisma migrate, e2e seed | ? | — | `docker compose --profile local-db` |
| Playwright | FND-01/02 verification | ✓ | 1.61.0 | — |
| `.env.test` + DATABASE_URL | e2e global-setup | ? | — | Документировать в plan setup step |

**Missing dependencies with no fallback:**
- `DATABASE_URL` для миграций и e2e — блокер выполнения планов.

**Missing dependencies with fallback:**
- Vitest — Playwright `request` fixture для API-тестов.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.61.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `pnpm exec playwright test e2e/api-auth.spec.ts` |
| Full suite command | `pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | Adjustment sessions excluded from `getTopStudents` count | unit (preferred) or integration | `pnpm exec vitest run src/shared/lib/analytics-queries/filters.test.ts` | ❌ Wave 0 |
| FND-01 | Prior credit completions excluded from step counts | unit | same as above | ❌ Wave 0 |
| FND-02 | Unauthenticated API → 401 | e2e API | `pnpm exec playwright test e2e/api-auth.spec.ts -g "401"` | ❌ Wave 0 |
| FND-02 | STUDENT cannot read other group students | e2e API | `pnpm exec playwright test e2e/api-auth.spec.ts -g "cross-group"` | ❌ Wave 0 |
| FND-02 | STUDENT cannot read other student sessions (no date) | e2e API | `pnpm exec playwright test e2e/api-auth.spec.ts -g "sessions"` | ❌ Wave 0 |
| FND-03 | `updateStudentProgress` syncs journal + portal step index | e2e | `pnpm exec playwright test e2e/student-progress.spec.ts` | ❌ Wave 0 |
| FND-04 | Progress change creates `AuditEvent` row | e2e API or db assert | `pnpm exec playwright test e2e/domain-events.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm exec playwright test e2e/api-auth.spec.ts` (после FND-02 tasks)
- **Per wave merge:** `pnpm test:e2e`
- **Phase gate:** Full suite green + ручная проверка analytics dashboard с adjustment-данными

### Wave 0 Gaps

- [ ] `e2e/api-auth.spec.ts` — FND-02 matrix (использовать `TEST_CODES`, `request` + session cookies после `loginAs` или storage state)
- [ ] `e2e/helpers/api.ts` — `apiGetAs(code, path)`, `expectForbidden`
- [ ] `src/shared/lib/analytics-queries/filters.test.ts` — FND-01 (требует vitest install OR inline test via tsx script)
- [ ] `e2e/domain-events.spec.ts` — FND-04 audit row assertion
- [ ] `e2e/student-progress.spec.ts` — FND-03 manager edit → journal + student portal
- [ ] Prisma migration + seed update: existing adjustment rows backfilled

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | NextAuth JWT; middleware session gate для API |
| V3 Session Management | partial | JWT stateless; idle timeout — Phase 5 |
| V4 Access Control | **yes (core)** | `authorizeApiRequest()` default-deny + ownership checks |
| V5 Input Validation | yes | Zod schemas на API boundary (существует) |
| V6 Cryptography | no | Не затрагивается Phase 0 |
| V9 Logging | yes | `AuditEvent` via `dispatchDomainEvent` |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| STUDENT reads other group via `GET /api/students` | Information disclosure | FND-02 group ownership [VERIFIED: known bug] |
| Any auth user reads 30 sessions without date | Information disclosure | FND-02 studentId scope on all GET variants |
| Forgotten `auth()` on new API route | Elevation | Middleware auth gate + code review checklist |
| Audit log injection via client | Tampering | Server-only `dispatchDomainEvent`; payload from server state |

## Sources

### Primary (HIGH confidence)

- Codebase: `src/shared/lib/analytics.ts`, `sync-completions-for-progress.ts`, `recalculate-step-progress.ts`, `step-offset.ts`
- Codebase: `src/app/api/students/route.ts`, `sessions/route.ts`, `step-completions/**`
- Codebase: `middleware.ts`, `prisma/schema.prisma`, `package.json`, `playwright.config.ts`
- `.planning/codebase/CONCERNS.md` — auth gaps, synthetic sessions
- `.planning/research/ARCHITECTURE.md` — target module layout, Prisma extensions
- `.planning/research/PITFALLS.md` — analytics filtering pitfalls

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — middleware vs per-route decision pending
- `.cursor/rules/new-module-tests.mdc` — e2e requirement for new API flows

### Tertiary (LOW confidence)

- Vitest as optional Wave 0 — не проверялся в CI проекта (CI отсутствует [VERIFIED: CONCERNS.md])

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — brownfield, версии из lockfile
- Architecture: HIGH — прямой аудит кода + согласованный research doc
- Pitfalls: HIGH — воспроизводимые bugs в CONCERNS.md

**Research date:** 2026-06-24  
**Valid until:** 2026-07-24 (stable stack); 2026-07-01 для next-auth beta API

---

## RESEARCH COMPLETE

**Phase:** 0 — Foundation  
**Confidence:** HIGH

### Key Findings

- Аналитика искажена из-за отсутствия `isAdjustment`/`isPriorCredit` и единого filter layer; backfill обязателен.
- Два подтверждённых API auth bug (students cross-group, sessions without date) закрываются `authorizeApiRequest()` с матрицей default-deny.
- Прогресс размазан по 8+ call sites — консолидация в `student-progress/` без смены бизнес-логики.
- `dispatchDomainEvent` + `AuditEvent` — минимальный write path в Phase 0; UI аудита и notifications — позже.

### File Created

`.planning/phases/00-foundation/00-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Verified package.json + codebase |
| Architecture | HIGH | Code audit + existing ARCHITECTURE research |
| Pitfalls | HIGH | Known bugs documented in CONCERNS.md |

### Open Questions

- Middleware authentication gate для `/api/*` в scope Phase 0 или отдельный plan.
- Удаление defensive recalculate на read-path — Phase 0 vs Phase 1.

### Ready for Planning

Research complete. Planner can now create PLAN.md files.
