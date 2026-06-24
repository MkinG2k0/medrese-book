---
phase: 08-leave-requests
plan: 01
subsystem: database
tags: [prisma, postgres, zod, leave-requests, substitution, domain-events]

requires: []
provides:
  - Prisma-модели LeaveRequest и Substitution с enums VACATION/DAY_OFF/SICK_LEAVE
  - Zod-схемы create/approve/reject для заявок на отсутствие
  - Domain events LEAVE_REQUEST_* и SUBSTITUTION_ACTIVATED
  - Хелпер isSubstitutionCurrentlyActive для авто-деактивации по endDate
affects: [08-02, 08-03, 08-04, 08-05]

tech-stack:
  added: []
  patterns:
    - "LeaveRequest.substitutionId — FK к Substitution; leaveRequestId на Substitution — скаляр для обратной ссылки"
    - "Нормализация дат start/end of day — в actions, не в schema"

key-files:
  created:
    - prisma/migrations/20260624234758_leave_requests_substitutions/migration.sql
    - src/shared/lib/validations/leave-request.ts
    - src/features/leave-requests/model/types.ts
    - src/features/leave-requests/lib/leave-labels.ts
    - src/features/leave-requests/lib/substitution-active.ts
    - src/features/leave-requests/index.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/domain-events/types.ts

key-decisions:
  - "Связь LeaveRequest↔Substitution через substitutionId на LeaveRequest; leaveRequestId на Substitution — скаляр без второго @relation (ограничение Prisma 1:1)"
  - "Drift миграции add_student_status разрешён через migrate resolve --applied перед новой миграцией"

patterns-established:
  - "DTO-сериализация LeaveRequest/Substitution через serialize* в model/types.ts"
  - "Русские метки типов и статусов в leave-labels.ts"

requirements-completed: [LEAV-05, TCHR-05]

duration: 25min
completed: 2026-06-25
---

# Phase 08 Plan 01: Схема данных отпусков Summary

**Prisma-модели LeaveRequest/Substitution с SICK_LEAVE, Zod-валидации и domain events для фундамента фазы отпусков**

## Performance

- **Duration:** 25 min
- **Started:** 2026-06-25T00:00:00Z
- **Completed:** 2026-06-25T00:25:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Добавлены enums `LeaveRequestType` (VACATION, DAY_OFF, SICK_LEAVE) и `LeaveRequestStatus` (CREATED, APPROVED, REJECTED)
- Модели `LeaveRequest` и `Substitution` с индексами и связями Teacher
- Zod-схемы create/approve/reject с русскими сообщениями об ошибках
- Расширены `DomainEventAction` четырьмя leave/substitution actions
- Хелпер `isSubstitutionCurrentlyActive` с `date-fns endOfDay`
- Миграция `leave_requests_substitutions` применена к БД

## Task Commits

1. **Task 1: Prisma-модели LeaveRequest и Substitution** - `3c2467b` (feat)
2. **Task 2: Zod-схемы, типы фичи и domain events** - `13d7e19` (feat)
3. **Task 3: Применить миграцию Prisma** - `46c6751` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — enums, модели, relations на Teacher
- `prisma/migrations/20260624234758_leave_requests_substitutions/migration.sql` — SQL миграция
- `src/shared/lib/validations/leave-request.ts` — create/approve/reject schemas
- `src/shared/lib/domain-events/types.ts` — LEAVE_REQUEST_* и SUBSTITUTION_ACTIVATED
- `src/features/leave-requests/model/types.ts` — DTO и serialize helpers
- `src/features/leave-requests/lib/leave-labels.ts` — русские метки
- `src/features/leave-requests/lib/substitution-active.ts` — проверка активности замещения
- `src/features/leave-requests/index.ts` — публичный barrel

## Decisions Made

- Связь 1:1 LeaveRequest→Substitution через `substitutionId`; `leaveRequestId` на Substitution хранится как скаляр (синхронизируется в actions при approve)
- Drift по `add_student_status` разрешён через `migrate resolve --applied` — БД уже содержала колонку status

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Разрешён drift миграции student_status**
- **Found during:** Task 3 (migrate dev)
- **Issue:** Миграция `20260624223910_add_student_status` не была в `_prisma_migrations`, но колонка уже в БД
- **Fix:** `prisma migrate resolve --applied 20260624223910_add_student_status`, затем migrate dev
- **Files modified:** нет (только состояние БД)
- **Verification:** `pnpm prisma migrate status` — Database schema is up to date
- **Committed in:** 46c6751 (Task 3 commit)

**2. [Rule 1 - Bug] Упрощена связь LeaveRequest↔Substitution для Prisma**
- **Found during:** Task 1 (prisma validate)
- **Issue:** Два FK на одну 1:1 связь (substitutionId + leaveRequestId с @relation) невалидны в Prisma
- **Fix:** FK только на LeaveRequest.substitutionId; leaveRequestId — скаляр @unique без @relation fields
- **Files modified:** prisma/schema.prisma
- **Verification:** `pnpm prisma validate` passed
- **Committed in:** 3c2467b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Оба исправления необходимы для валидной схемы и применения миграции. Семантика плана сохранена.

## Issues Encountered

- `pnpm exec tsc --noEmit` падает на pre-existing ошибках в `.next/types` и `StudentSessionsTable.tsx` — не связаны с изменениями плана

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Схема БД и validations готовы для server actions (plan 08-02)
- `isSubstitutionCurrentlyActive` готов для auth/substitution checks (plan 08-03+)
- При approve actions нужно синхронизировать `substitutionId` и `leaveRequestId`

---
*Phase: 08-leave-requests*
*Completed: 2026-06-25*

## Self-Check: PASSED

- FOUND: prisma/migrations/20260624234758_leave_requests_substitutions/migration.sql
- FOUND: src/shared/lib/validations/leave-request.ts
- FOUND: src/features/leave-requests/index.ts
- FOUND: commit 3c2467b
- FOUND: commit 13d7e19
- FOUND: commit 46c6751
