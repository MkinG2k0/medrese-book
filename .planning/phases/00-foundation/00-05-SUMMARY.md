---
phase: 00-foundation
plan: 05
subsystem: infrastructure
tags: [domain-events, audit, prisma, dispatchDomainEvent, playwright, FND-04]

requires:
  - phase: 00-foundation-04
    provides: atomic updateStudentProgress transaction (sync → update → recalculate)
provides:
  - AuditEvent Prisma model + foundation_audit_event migration
  - src/shared/lib/domain-events/ with dispatchDomainEvent fan-out
  - writeAuditEvent with optional TransactionClient
  - dispatch wired to progress, sessions, completions, user-admin mutations
  - e2e/domain-events.spec.ts GREEN
affects: [phase-6-notifications, phase-7-audit-ui]

tech-stack:
  added: []
  patterns:
    - "dispatchDomainEvent(event, tx?) inside same prisma.$transaction as mutation"
    - "Server-derived audit payload only; no client audit API"
    - "enqueueNotifications no-op stub until Phase 6"

key-files:
  created:
    - prisma/migrations/20260624140000_foundation_audit_event/migration.sql
    - src/shared/lib/domain-events/dispatch.ts
    - src/shared/lib/domain-events/types.ts
    - src/shared/lib/domain-events/index.ts
    - src/shared/lib/domain-events/handlers/audit.ts
    - src/shared/lib/domain-events/handlers/notifications.ts
    - src/shared/lib/audit/write-audit-event.ts
  modified:
    - prisma/schema.prisma
    - src/features/student-admin/actions/student-admin-actions.ts
    - src/features/user-admin/actions/user-actions.ts
    - src/app/api/sessions/route.ts
    - src/app/api/step-completions/route.ts
    - src/app/api/step-completions/[id]/route.ts
    - e2e/domain-events.spec.ts
    - e2e/helpers/db.ts
    - e2e/helpers/antd.ts

key-decisions:
  - "enqueueNotifications remains empty async stub — Phase 6 scope"
  - "COMPLETION_CHANGED delete uses studentId as entityId for batch operations"
  - "Test DB migrate deploy via dotenv .env.test; dev .env has migration history drift"

patterns-established:
  - "Features import only @/shared/lib/domain-events — no audit-log feature cross-imports"
  - "countAuditEvents(action?, entityId?) in e2e/helpers/db.ts for audit assertions"

requirements-completed: [FND-04]

duration: 45min
completed: 2026-06-24
---

# Phase 0 Plan 05: Domain Events Summary

**dispatchDomainEvent с AuditEvent в той же транзакции, что и мутация; критические write-paths порождают аудит без cross-feature imports**

## Performance

- **Duration:** 45 min
- **Started:** 2026-06-24T18:15:00Z
- **Completed:** 2026-06-24T19:00:00Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Модель `AuditEvent` и миграция `foundation_audit_event` с индексами по `createdAt` и `(entityType, entityId)`
- Модуль `src/shared/lib/domain-events/`: union `DomainEvent`, `dispatchDomainEvent` → `writeAuditEvent` + no-op `enqueueNotifications`
- `writeAuditEvent` принимает optional `Prisma.TransactionClient` (Pitfall 4)
- Подключены мутации: `updateStudentProgress`, `createUsers`/`updateUser` (student), `POST /api/sessions`, `DELETE`/`PATCH` step-completions
- `e2e/domain-events.spec.ts` GREEN: manager меняет прогресс → `STUDENT_PROGRESS_CHANGED` в `AuditEvent`

## Task Commits

1. **Task 1: AuditEvent schema + domain-events module** - `f01270d` (feat)
2. **Task 2: Применить миграцию AuditEvent** - `c95731d` (chore)
3. **Task 3: Wire mutations + GREEN e2e domain-events** - `e82b37d` (feat)

## Files Created/Modified

- `src/shared/lib/domain-events/` — публичный API: `dispatchDomainEvent`, типы событий, handlers
- `src/shared/lib/audit/write-audit-event.ts` — `prisma.auditEvent.create` с tx
- `src/features/student-admin/actions/student-admin-actions.ts` — `STUDENT_PROGRESS_CHANGED` в `$transaction`
- `src/features/user-admin/actions/user-actions.ts` — `STUDENT_CREATED` / `STUDENT_UPDATED`
- `src/app/api/sessions/route.ts` — `SESSION_SAVED`
- `src/app/api/step-completions/` — `COMPLETION_CHANGED` на DELETE/PATCH в транзакции
- `e2e/helpers/db.ts` — `countAuditEvents(action?, entityId?)`
- `e2e/domain-events.spec.ts` — FND-04 audit row assertion

## Decisions Made

- `enqueueNotifications` — пустая async function до Phase 6 (как в RESEARCH)
- При batch DELETE completions `entityId` = `studentId` (один ученик на запрос)
- Миграция применена на test Neon через `migrate deploy` + `.env.test`; dev `.env` DB имеет drift (как в plan 02)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] prisma migrate dev failed on dev .env DB drift**
- **Found during:** Task 2
- **Issue:** `pnpm db:migrate` на `.env` DATABASE_URL — drift detected, interactive reset required
- **Fix:** Создана миграция вручную; `migrate deploy` через dotenv `.env.test` на test Neon
- **Files modified:** `prisma/migrations/20260624140000_foundation_audit_event/migration.sql`
- **Verification:** `prisma migrate status` — Database schema is up to date (test DB)
- **Committed in:** `c95731d`

**2. [Rule 1 - Bug] Prisma Json payload type error**
- **Found during:** Task 3 verification (`tsc --noEmit`)
- **Issue:** `Record<string, unknown>` not assignable to `InputJsonValue`
- **Fix:** Cast `event.payload as Prisma.InputJsonValue` in `writeAuditEvent`
- **Committed in:** `e82b37d`

**3. [Rule 1 - Bug] Flaky e2e select + missing save wait**
- **Found during:** Task 3 (`domain-events.spec.ts`)
- **Issue:** Ant Design select unstable click; audit count checked before save completed
- **Fix:** Improved `selectStudentProgressStep` (combobox + visible dropdown); dynamic step target + URL wait like `student-progress.spec.ts`
- **Files modified:** `e2e/helpers/antd.ts`, `e2e/domain-events.spec.ts`
- **Committed in:** `e82b37d`

## Issues Encountered

- Dev `.env` PostgreSQL (147.45.234.86) не синхронизирован с migration history — не блокирует e2e/test DB; требует `migrate resolve` при локальной разработке на этой БД

## User Setup Required

None for test DB. For dev `.env` DB with drift: run `prisma migrate resolve --applied` for pending migrations or `migrate deploy` after resolve.

## Next Phase Readiness

- FND-04 complete; Phase 6 может заменить no-op `enqueueNotifications`
- Phase 7 audit UI может читать `AuditEvent` с фильтрацией payload PII

## Self-Check: PASSED

- FOUND: `.planning/phases/00-foundation/00-05-SUMMARY.md`
- FOUND: `f01270d`, `c95731d`, `e82b37d`
- FOUND: `src/shared/lib/domain-events/dispatch.ts`
- VERIFY: `pnpm exec tsc --noEmit` — pass
- VERIFY: `pnpm exec playwright test e2e/domain-events.spec.ts` — 1 passed

---
*Phase: 00-foundation*
*Completed: 2026-06-24*
