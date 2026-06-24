# Architecture Patterns

**Domain:** LMS extensions for medrese electronic journal (brownfield FSD + Next.js 16)
**Researched:** 2026-06-24
**Overall confidence:** HIGH (grounded in existing codebase analysis + FSD official guidance)

## Executive Recommendation

Расширять существующую FSD-структуру **вертикальными feature-слайсами** для пользовательских сценариев и **горизонтальными shared-сервисами** для сквозной логики (прогресс, аналитика, аудит, уведомления). Не создавать «god-feature» `analytics` — разделить **агрегированную аналитику** (`features/analytics`) и **профиль/историю ученика** (`features/student-profile`). Сквозные события (смена преподавателя, назначение задания, одобрение отпуска) проходят через единый `shared/lib/domain-events/` → audit + notifications.

Текущий проект уже следует brownfield-паттерну FSD: тонкие маршруты в `src/app/`, бизнес-логика в `src/features/`, типы и React Query в `src/entities/`, инфраструктура в `src/shared/`. Новые модули должны **повторять этот паттерн**, а не вводить параллельную структуру.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  src/app/(dashboard)/          Thin routes: auth guard + data fetch     │
│  src/widgets/app-shell/        Shell + NotificationBell (new widget)    │
├─────────────────────────────────────────────────────────────────────────┤
│  FEATURES (user scenarios)                                              │
│  ┌──────────────┐ ┌─────────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ journal      │ │ student-profile │ │ assignments  │ │ leave      │ │
│  │ (+timer)     │ │ (+history card) │ │              │ │            │ │
│  └──────┬───────┘ └────────┬────────┘ └──────┬───────┘ └─────┬──────┘ │
│  ┌──────────────┐ ┌─────────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ analytics    │ │ substitutions   │ │ notifications│ │ audit-log  │ │
│  │ (aggregate)  │ │                 │ │              │ │ (viewer)   │ │
│  └──────┬───────┘ └────────┬────────┘ └──────┬───────┘ └─────┬──────┘ │
├─────────┴──────────────────┴─────────────────┴───────────────┴────────┤
│  ENTITIES (types + React Query hooks)                                   │
│  student · session · assignment · leave · substitution · notification   │
│  audit-event · teacher-metrics                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  SHARED (cross-cutting domain services)                                 │
│  lib/student-progress/  lib/student-metrics/  lib/analytics-queries/    │
│  lib/domain-events/     lib/audit/            lib/notifications/      │
│  lib/validations/       lib/authorize-*.ts    api/ (response envelope)  │
├─────────────────────────────────────────────────────────────────────────┤
│  Prisma + PostgreSQL                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities (unchanged, extended)

| Layer | Responsibility | New modules live here |
|-------|---------------|----------------------|
| `app/` | URL, layout, role gating, API route handlers | New routes only; no business logic |
| `widgets/` | Composite UI spanning features | `notification-bell/` in AppShell header |
| `features/` | End-to-end user scenarios | One feature per backlog domain area |
| `entities/` | Domain types + `use-*` React Query hooks | New models with client polling needs |
| `shared/lib/` | Pure/domain services callable from actions & API | Progress, metrics, audit write, event dispatch |

**FSD import rule (enforce):** `app → widgets → features → entities → shared`. Features **не импортируют друг друга** напрямую; общение через `shared/lib` или `@x`-notation на entities-слое при необходимости.

---

## Module Map: Where Each Backlog Item Lives

| Backlog area | Primary slice | Secondary / shared | Route prefix |
|--------------|---------------|-------------------|--------------|
| Lesson timer (start/end) | `features/journal` | `entities/session`, `shared/lib/validations/session.ts` | `/journal/[studentId]` (in-place) |
| Student metrics & 48h norm | `shared/lib/student-metrics/` | consumed by `analytics`, `student-profile`, `journal` | — |
| Aggregate analytics (monthly) | `features/analytics` (extend) | migrate queries from `shared/lib/analytics.ts` → `shared/lib/analytics-queries/` | `/analytics` |
| Student history & card | `features/student-profile` (new) | `entities/student`, `entities/session` | `/students/[studentId]` |
| Student statuses | `features/student-profile` | Prisma `StudentStatus` enum | same |
| Assignments catalog + assign | `features/assignments` (new) | `entities/assignment` | `/admin/assignments`, inline in journal/card |
| Teacher substitution | `features/substitutions` (new) | integrates with `features/auth` switch guard | `/admin/substitutions` |
| Leave / vacations | `features/leave` (new) | triggers `substitutions` via domain event | `/leave`, `/admin/leave` |
| Notifications (bell) | `features/notifications` + `widgets/notification-bell` | `entities/notification`, `shared/lib/notifications/` | header widget, `/notifications` |
| Audit log viewer | `features/audit-log` (new) | `shared/lib/audit/` write path | `/admin/audit` |
| Login/session security | `features/auth` (extend) | middleware idle timeout, `AuthSessionLog` model | global |
| Teacher analytics (phase 3) | `features/teacher-analytics` (new) | reuses `shared/lib/analytics-queries/` | `/analytics/teachers` |

### Split: `analytics` vs `student-profile`

**Проблема:** Сейчас `features/analytics` — тонкая обёртка над `shared/lib/analytics.ts`; история ученика размазана между `journal/history` и `student-portal`.

**Решение:**
- `features/analytics` — **только агрегаты**: топ учеников, статистика по уровням, фильтры месяц/преподаватель. Drill-down ведёт на карточку ученика.
- `features/student-profile` — **единый источник правды** для карточки: контакты, статус, преподаватель, timeline (сессии, оценки, шаги, задания, время), норматив 48ч.
- `features/journal/ui/JournalHistoryPage` — **deprecated path**: постепенно редиректить на `student-profile` с вкладкой «История шагов» или встроить `StepHistoryPage` как подкомпонент через props (journal импортирует UI из student-profile допустимо только если вынести в `entities` или `shared/ui` — лучше **composition на уровне page**).

---

## Component Boundaries

### 1. Student Progress Engine (`shared/lib/student-progress/`)

**Ответственность:** `currentStepIdx`, пересчёт после completion, исключение «зачтено ранее», level auto-advance.

**Сейчас:** логика в `recalculate-step-progress.ts`, `sync-completions-for-progress.ts`, `step-offset.ts` — размазана (CONCERNS.md).

**Целевая граница:**
```
shared/lib/student-progress/
  recalculate.ts          # единственная точка пересчёта currentStepIdx
  sync-for-progress.ts    # admin backfill с флагом isAdjustment
  offsets.ts              # кэш offset по уровням
  filters.ts              # excludePriorCredit(completions)
```

**Коммуникация:** вызывается из `journal` actions, `sessions` API, `student-admin`, `assignments` (если задание влияет на прогресс — нет в v1).

**Не делает:** UI, аналитические агрегаты, уведомления.

---

### 2. Student Metrics (`shared/lib/student-metrics/`)

**Ответственность:** вычисляемые метрики одного ученика — кол-во уроков, пройденных шагов, суммарное время, прогресс по уровню, нарушение норматива 48ч.

**Вход:** `studentId`, опционально date range.

**Выход:** typed DTO для UI и analytics.

**Фильтрация:** исключает `Session.isAdjustment = true` и `StepCompletion.isPriorCredit = true`.

**Потребители:** `student-profile`, `analytics`, `journal` (badge предупреждения), `student-portal`.

---

### 3. Analytics Queries (`shared/lib/analytics-queries/`)

**Ответственность:** SQL/Prisma агрегации для дашбордов (не per-student timeline).

**Миграция:** перенести `getTopStudents`, `getLevelStats` из `shared/lib/analytics.ts`; добавить `getTeacherMetrics` (фаза 3).

**Потребители:** только `features/analytics`, `features/teacher-analytics`.

---

### 4. Domain Events Hub (`shared/lib/domain-events/`)

**Ответственность:** после успешной мутации — fan-out в audit + notifications.

```typescript
// shared/lib/domain-events/dispatch.ts
export async function dispatchDomainEvent(event: DomainEvent, tx?: PrismaTransaction) {
  await writeAuditEvent(event, tx)
  await enqueueNotifications(event, tx)
}
```

**События (enum):** `LESSON_STARTED`, `LESSON_ENDED`, `SESSION_SAVED`, `STUDENT_STATUS_CHANGED`, `TEACHER_CHANGED`, `ASSIGNMENT_GIVEN`, `ASSIGNMENT_COMPLETED`, `SUBSTITUTION_CREATED`, `LEAVE_APPROVED`, `LOGIN`, `LOGOUT`, `IMPERSONATION`.

**Граница:** features вызывают `dispatchDomainEvent` **после** Prisma commit (или внутри `$transaction`). Features **не вызывают** `writeAuditEvent` / `enqueueNotifications` напрямую.

---

### 5. Audit (`shared/lib/audit/` + `features/audit-log/`)

| Part | Location | Role |
|------|----------|------|
| Write | `shared/lib/audit/write-audit-event.ts` | Append-only insert; called only from domain-events |
| Read/query | `features/audit-log/actions/` | Filtered list for managers |
| UI | `features/audit-log/ui/` | Table + filters |
| Types | `entities/audit-event/model/types.ts` | Shared DTO shape |

**Не смешивать** с notifications — разные модели, разные retention policies.

---

### 6. Notifications (`shared/lib/notifications/` + `features/notifications/` + `widgets/notification-bell/`)

| Part | Location | Role |
|------|----------|------|
| Create | `shared/lib/notifications/enqueue.ts` | Maps domain events → Notification rows per recipient role |
| Fetch | `entities/notification/api/use-notifications.ts` | `GET /api/notifications`, polling 30–60s |
| Mark read | `POST /api/notifications/[id]/read` | |
| Bell UI | `widgets/notification-bell/` | Header badge; depends on `entities/notification` only |
| Full list | `features/notifications/ui/` | `/notifications` page |

**v1:** polling, без WebSocket (PROJECT.md). Chat — отдельный feature в фазе 3, не в notifications.

---

### 7. Journal + Lesson Timer (`features/journal` extend)

**Граница:** таймер — часть сценария урока, не отдельный feature.

**Новое состояние:**
- Server: `Session.startedAt`, `Session.endedAt`, `Session.durationMinutes` (computed on end)
- Client: extend `journal-store.ts` + `use-lesson-page.ts` — `lessonPhase: 'idle' | 'active' | 'completed'`

**Data access pattern (существующий):**
- Start/end lesson → `PATCH /api/sessions/[id]/timer` (новый endpoint, частые мутации)
- Save grades → existing `POST /api/sessions`

**Почему API, не server action:** интерактивный таймер с polling/optimistic updates; соответствует паттерну journal (React Query + Zustand).

---

### 8. Assignments (`features/assignments`)

```
features/assignments/
  actions/assignment-admin-actions.ts   # CRUD шаблонов (MANAGER)
  actions/assignment-actions.ts         # назначить/закрыть (TEACHER)
  ui/AssignmentCatalog.tsx              # admin
  ui/StudentAssignmentsPanel.tsx        # embed в student-profile + journal sidebar
  lib/assignment-status.ts
entities/assignment/
  model/types.ts
  api/use-student-assignments.ts
```

**Граница:** assignments **не** меняют `currentStepIdx` в v1. Связь с историей ученика — read-only в timeline.

---

### 9. Substitutions + Leave (`features/substitutions`, `features/leave`)

**Substitutions:**
- Модель `TeacherSubstitution`: `substituteTeacherId`, `originalTeacherId`, `startsAt`, `endsAt`, `reason`, `createdBy`
- Auth guard: `features/auth/lib/can-switch-user.ts` + middleware — разрешить вход под чужой учёткой **только** при активном substitution

**Leave:**
- Модель `LeaveRequest`: teacher, dates, status, approver
- On approve → `dispatchDomainEvent(LEAVE_APPROVED)` → auto-create `TeacherSubstitution` (lib в `features/leave/lib/auto-substitute.ts`)

**Граница:** leave **оркестрирует** substitution через domain event, не импортирует UI substitutions.

---

### 10. Security extensions (`features/auth` + `shared/lib/session-security/`)

- Idle timeout (1h): client hook в `AppShell` + server-side `lastActivityAt` в JWT refresh или DB session log
- Login/logout audit: события через `dispatchDomainEvent`
- Impersonation guard: расширить `switch-user-actions.ts` — проверка substitution; audit every switch

---

## Data Flow

### Flow A: Lesson with Timer (Phase 1)

```
Teacher → /journal/[studentId]
  → page.tsx: getStudentLesson() [server action]
  → LessonPage (client)
  → useLessonPage:
       [Start] → PATCH /api/sessions/.../timer { action: 'start' }
              → dispatchDomainEvent(LESSON_STARTED)
              → journal-store.lessonPhase = 'active'
       [End]   → PATCH ... { action: 'end' } → durationMinutes persisted
              → dispatchDomainEvent(LESSON_ENDED)
       [Save]  → POST /api/sessions (existing) → recalculateStudentStepIdx
              → dispatchDomainEvent(SESSION_SAVED)
              → revalidatePath + React Query invalidate
```

### Flow B: Student History / Card (Phase 1–2)

```
Manager → /students/[studentId]
  → page.tsx: requireRoles + getStudentProfile() [server action]
       ├─ prisma: student + group + teacher
       ├─ getStudentMetrics(studentId) [shared]
       └─ getStudentTimeline(studentId) [student-profile action]
  → StudentProfilePage (client)
       ├─ tabs: Обзор | История | Задания
       └─ filters via searchParams (date range) — SSR first paint, client refetch optional
```

### Flow C: Assignment Given (Phase 2)

```
Teacher → StudentAssignmentsPanel → POST /api/assignments
  → auth + authorize-student
  → prisma.studentAssignment.create
  → dispatchDomainEvent(ASSIGNMENT_GIVEN)
       ├─ audit row
       └─ notification → student (and manager if configured)
  → invalidate ['student-assignments', studentId]
```

### Flow D: Leave Approved → Auto-Substitution (Phase 2)

```
Manager → LeaveApprovalButton → server action approveLeaveRequest()
  → prisma.$transaction:
       leaveRequest.status = APPROVED
       substitution = createSubstitution(...)
  → dispatchDomainEvent(LEAVE_APPROVED)
  → revalidatePath('/leave', '/admin/substitutions')
```

### Flow E: Notifications Bell (Phase 3)

```
AppShell mount
  → NotificationBell → useNotifications() → GET /api/notifications?unreadOnly=true
  → poll every 60s
  → on click → /notifications or popover list
  → mark read → PATCH /api/notifications/[id]
```

### Flow F: Audit Viewer (Phase 3)

```
Manager → /admin/audit?studentId=&teacherId=&type=&from=&to=
  → server action getAuditEvents(filters) — read-only, paginated
  → AuditLogTable (client) — URL-synced filters
```

---

## Data Access Pattern Decision Matrix

| Scenario | Pattern | Rationale (existing codebase) |
|----------|---------|------------------------------|
| SSR page initial load | Server action in `features/*/actions/` | `analytics/page.tsx`, `journal/[studentId]/page.tsx` |
| Interactive lesson / timer | REST API + React Query + Zustand | `use-lesson-page.ts`, `journal-store.ts` |
| Admin CRUD (low frequency) | Server action + `revalidatePath` | `program-admin`, `user-admin` |
| Polling (notifications) | REST API + React Query `refetchInterval` | New; no WebSocket in v1 |
| Cross-feature side effects | `shared/lib/domain-events/` | Avoids feature-to-feature imports |
| Analytics aggregates | Server action or direct call in page | Keep pages thin |

---

## Prisma Schema Extensions (architectural boundaries)

Новые модели и поля задают границы entities. Рекомендуемые группы миграций:

**Migration 1 — Lesson timing & analytics flags (Phase 1):**
```prisma
model Session {
  // existing fields...
  startedAt       DateTime?
  endedAt         DateTime?
  durationMinutes Int?
  isAdjustment    Boolean  @default(false)  // synthetic progress sessions
}

model StepCompletion {
  // existing fields...
  isPriorCredit   Boolean  @default(false)  // «зачтено ранее»
}
```

**Migration 2 — Student lifecycle (Phase 2):**
```prisma
enum StudentStatus { ACTIVE PAUSED COMPLETED ARCHIVED }

model Student {
  status        StudentStatus @default(ACTIVE)
  statusReason  String?
  // teacher change history → separate model or audit-only in v1
}
```

**Migration 3 — Assignments (Phase 2):**
```prisma
model AssignmentTemplate { ... }
model StudentAssignment { studentId, templateId?, customTitle?, status, dueAt, ... }
```

**Migration 4 — Substitutions & Leave (Phase 2):**
```prisma
model TeacherSubstitution { ... }
model LeaveRequest { ... }
```

**Migration 5 — Audit & Notifications (Phase 1 infra write, Phase 3 UI):**
```prisma
model AuditEvent { actorId, entityType, entityId, action, payload Json, createdAt }
model Notification { userId, type, title, body, readAt?, createdAt }
model AuthSessionLog { userId, event, ip?, userAgent?, createdAt }
```

Индексы: `@@index([studentId])`, `@@index([userId, readAt])` на Notification, `@@index([createdAt])` на AuditEvent — по CONCERNS.md.

---

## Suggested Build Order

Порядок учитывает зависимости данных, переиспользование shared-сервисов и PROJECT.md фазы.

### Stage 0 — Foundation (перед фичами, 3–5 дней)

| # | Work | Unblocks |
|---|------|----------|
| 0.1 | Prisma: `isAdjustment`, `isPriorCredit`, indexes | Корректная аналитика |
| 0.2 | `shared/lib/student-progress/` refactor (extract existing) | Все фазы |
| 0.3 | `shared/lib/domain-events/` + `audit/write` + `AuditEvent` model | Substitutions, security, assignments |
| 0.4 | API auth audit: shared `authorizeApiRequest()` helper | Все новые endpoints |
| 0.5 | `shared/lib/analytics-queries/` — extract + add exclusion filters | Phase 1 analytics |

**Флаг исследования:** Stage 0.4 требует решения — middleware для `/api/*` vs wrapper (см. CONCERNS.md).

---

### Stage 1 — Phase 1: Student Analytics & History

| # | Module | Depends on | Deliverable |
|---|--------|------------|-------------|
| 1.1 | `journal` timer | 0.1, 0.2 | Start/End UI, `PATCH` timer API |
| 1.2 | `shared/lib/student-metrics/` | 0.1, 0.2 | Metrics DTO + 48h norm check |
| 1.3 | `features/student-profile` | 1.2 | `/students/[studentId]` timeline |
| 1.4 | `features/analytics` extend | 0.5, 1.2 | Drill-down links, excluded credits |
| 1.5 | `student-portal` extend | 1.2 | Student sees own time/progress |

**Параллелизация:** 1.1 и 1.2 параллельно после 0.x. 1.3 после 1.2. 1.4 после 0.5.

---

### Stage 2 — Phase 2: Operations (students, assignments, staff)

| # | Module | Depends on | Deliverable |
|---|--------|------------|-------------|
| 2.1 | `student-profile` statuses | 1.3, Migration 2 | Status transitions + reasons |
| 2.2 | Teacher change + reason | 0.3 | Audit event, update group.teacherId |
| 2.3 | `features/assignments` | 0.3, Migration 3 | Catalog + per-student assign |
| 2.4 | `features/substitutions` | 0.3, Migration 4 | CRUD + auth guard |
| 2.5 | `features/leave` | 2.4 | Calendar, approval, auto-substitute |
| 2.6 | `features/auth` security | 0.3, AuthSessionLog | Idle timeout, login audit |

**Параллелизация:** 2.1–2.3 параллельно. 2.5 после 2.4. 2.6 можно начать рано (после 0.3).

---

### Stage 3 — Phase 3: Communications & Compliance

| # | Module | Depends on | Deliverable |
|---|--------|------------|-------------|
| 3.1 | `entities/notification` + API | 0.3, Migration 5 | CRUD read/mark-read |
| 3.2 | `widgets/notification-bell` | 3.1 | Header bell in AppShell |
| 3.3 | `features/notifications` | 3.1 | Full list page |
| 3.4 | `features/audit-log` | 0.3 | `/admin/audit` viewer |
| 3.5 | `features/teacher-analytics` | 0.5, 1.1 | Login vs lesson start metrics |

**Параллелизация:** 3.1–3.4 параллельно после Stage 0.3. 3.5 после 1.1 (needs `startedAt`).

---

### Dependency Graph (build order)

```
Stage 0 (foundation)
    ├──► 1.1 journal timer
    ├──► 1.2 student-metrics ──► 1.3 student-profile ──► 2.1 statuses
    │                              └──► 1.4 analytics extend
    │                              └──► 1.5 student-portal
    ├──► 2.2 teacher change
    ├──► 2.3 assignments
    ├──► 2.4 substitutions ──► 2.5 leave
    ├──► 2.6 auth security
    └──► 3.1 notifications ──► 3.2 bell + 3.3 page
         3.4 audit viewer
         1.1 + 0.5 ──► 3.5 teacher analytics
```

---

## Integration with Existing Modules

### Journal (`features/journal`)

- **Добавить:** timer controls в `LessonPageHeader`, timer state в `journal-store`
- **Не добавлять:** аналитику, историю заданий (только ссылка на student-profile)
- **Shared:** вызывает `student-metrics` для badge 48h на `StudentCard`

### Analytics (`features/analytics`)

- **Оставить:** monthly aggregate UI
- **Перенести:** query logic → `shared/lib/analytics-queries/`
- **Добавить:** ссылки на `/students/[id]`; teacher picker без изменений

### Student Admin (`features/student-admin`)

- **Сузить:** только форма редактирования прогресса (`/students/[id]/edit`)
- **Карточку:** перенести в `student-profile`; edit остаётся отдельным маршрутом

### Auth (`features/auth`)

- **Расширить:** substitution-aware switch, idle logout, audit login events
- **Не смешивать:** notification preferences (нет в v1)

### AppShell (`widgets/app-shell`)

- **Добавить:** `NotificationBell`, пункты меню для leave, audit, assignments (admin)
- **Обновить:** `auth.config.ts` `roleRoutes` для `/students`, `/leave`, `/admin/audit`, `/notifications`

### Groups (`features/groups`)

- **Минимальные изменения:** ссылки на student-profile вместо edit-only

---

## Patterns to Follow

### Pattern 1: Thin Route Page

**What:** `page.tsx` только auth + fetch + render feature UI.

**When:** Каждый новый маршрут.

**Example (existing):**
```typescript
// src/app/(dashboard)/analytics/page.tsx
export default async function AnalyticsPage({ searchParams }) {
  const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])
  const data = await getTopStudents(month, filterTeacherId)
  return <TopStudents data={data} />
}
```

### Pattern 2: Domain Event Side Effects

**What:** Мутация → `dispatchDomainEvent` → audit + notifications atomically.

**When:** Любое действие, требующее подотчётности (смена преподавателя, отпуск, задание).

```typescript
await prisma.$transaction(async (tx) => {
  const assignment = await tx.studentAssignment.create({ data })
  await dispatchDomainEvent({
    type: 'ASSIGNMENT_GIVEN',
    actorId: session.user.id,
    entityId: assignment.id,
    payload: { studentId, title },
  }, tx)
})
```

### Pattern 3: Analytics Exclusion Filter

**What:** Все метрики проходят через единый фильтр сессий/completions.

**When:** Любой подсчёт уроков, шагов, времени.

```typescript
const REAL_SESSIONS = { isAdjustment: false } as const
const REAL_COMPLETIONS = { isPriorCredit: false } as const
```

### Pattern 4: Embed Panels via Composition

**What:** `StudentAssignmentsPanel` рендерится и в journal, и в student-profile — один UI-компонент в `features/assignments/ui/`, страницы композируют.

**When:** Один виджет в нескольких маршрутах.

**FSD note:** допустимо, если panel не импортирует journal/student-profile internals — только props (`studentId`, `readOnly?`).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Feature-to-Feature Imports

**What:** `features/leave` импортирует `features/substitutions/actions/create.ts`.

**Why bad:** Циклические зависимости, невозможность удалить feature.

**Instead:** `shared/lib/domain-events/` или `shared/lib/substitutions/create-substitution.ts`.

### Anti-Pattern 2: Analytics Logic in UI Components

**What:** `TopStudents.tsx` считает метрики из сырых completions.

**Why bad:** Дублирование с student-profile; расхождение цифр (уже проблема с synthetic sessions).

**Instead:** `shared/lib/student-metrics/` и `shared/lib/analytics-queries/`.

### Anti-Pattern 3: God Feature `analytics`

**What:** Вся история, карточка, задания, таймер в одном feature.

**Why bad:** 3000+ строк, конфликты в journal-паттерне.

**Instead:** Разделение по user scenario (см. Module Map).

### Anti-Pattern 4: Server Actions for High-Frequency Timer Ticks

**What:** `'use server'` на каждую секунду таймера.

**Why bad:** Лишняя нагрузка, нет optimistic UI.

**Instead:** Client timer display local; persist only start/end via API.

### Anti-Pattern 5: Notifications Without Audit

**What:** Уведомление без записи в AuditEvent.

**Why bad:** Менеджер не может восстановить цепочку решений.

**Instead:** Всегда через `dispatchDomainEvent`.

### Anti-Pattern 6: New API Routes Without Auth Wrapper

**What:** Копировать ad-hoc `auth()` checks (текущий tech debt).

**Why bad:** STUDENT data leak (CONCERNS.md — `GET /api/students`).

**Instead:** Stage 0.4 — единый `authorizeApiRequest({ roles, resource })` до добавления endpoints.

---

## Scalability Considerations

| Concern | At 10 teachers / 100 students | At 50 teachers / 500 students | At scale |
|---------|----------------------------|-------------------------------|----------|
| Student timeline | Server action, last 50 events | Paginate + cursor | Materialized `StudentTimeline` view |
| Monthly analytics | In-memory aggregate (current) | SQL `GROUP BY` in analytics-queries | Scheduled rollup table |
| Notifications | Poll 60s, unread count query | Index `(userId, readAt)` | Push (FCM) — out of v1 |
| Audit log | Full table scan OK | Paginate + date index | Archive to cold storage |
| Lesson timer | PATCH per start/end | Same | Same |
| Leave auto-substitute | Sync in transaction | Same | Job queue if rules complex |

---

## Route & Menu Additions

| Path | Feature | Roles |
|------|---------|-------|
| `/students/[studentId]` | student-profile | TEACHER, MANAGER, SUPER_ADMIN |
| `/admin/assignments` | assignments | MANAGER, SUPER_ADMIN |
| `/admin/substitutions` | substitutions | MANAGER, SUPER_ADMIN |
| `/leave` | leave | TEACHER |
| `/admin/leave` | leave (approval) | MANAGER, SUPER_ADMIN |
| `/notifications` | notifications | ALL (except SUPER_ADMIN for some types) |
| `/admin/audit` | audit-log | MANAGER, SUPER_ADMIN |
| `/analytics/teachers` | teacher-analytics | MANAGER, SUPER_ADMIN |

Обновить: `auth.config.ts` `roleRoutes`, `AppShell` `allMenuItems`.

---

## Research Flags for Phase Planning

| Phase topic | Needs deeper research | Reason |
|-------------|----------------------|--------|
| API auth unification | **Yes** | CONCERNS.md — middleware gap blocks safe endpoint scaling |
| 48h normative definition | **Yes** | Calendar hours vs lesson `durationMinutes` vs step `hours` — business rule |
| Auto-substitute rules | **Medium** | Кого назначать при отпуске — первый свободный? менеджер выбирает? |
| Notification delivery | **Low** | Polling sufficient for v1; template per event type |
| Chat (phase 3 deferred) | **Yes** | Separate architecture — not part of notifications v1 |

---

## Sources

| Source | Confidence | Used for |
|--------|------------|----------|
| `.planning/codebase/ARCHITECTURE.md` | HIGH | Existing layers, data flow, patterns |
| `.planning/codebase/STRUCTURE.md` | HIGH | Where to add code conventions |
| `.planning/codebase/CONCERNS.md` | HIGH | API auth, synthetic sessions, analytics debt |
| `.planning/PROJECT.md` | HIGH | Phase scope, backlog priorities |
| `prisma/schema.prisma` | HIGH | Current data model boundaries |
| [FSD Next.js guide](https://feature-sliced.design/docs/guides/tech/with-nextjs) | HIGH | Brownfield FSD + App Router |
| [FSD public API / @x notation](https://feature-sliced.github.io/documentation/docs/reference/public-api) | HIGH | Cross-slice entity communication |
| Context7 `/websites/feature-sliced_github_io` | HIGH | Import rules, cross-import patterns |

---

*Architecture research for LMS extensions milestone. Informs phase structure and module boundaries for roadmap creation.*
