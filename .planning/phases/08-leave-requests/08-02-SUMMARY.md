---
phase: 08-leave-requests
plan: 02
subsystem: api
tags: [leave-requests, substitution, server-actions, react-query, auth, domain-events]

requires:
  - phase: 08-01
    provides: Prisma-модели LeaveRequest/Substitution, Zod-схемы, domain events, isSubstitutionCurrentlyActive
provides:
  - Server actions create/approve/reject/listLeaveRequests с domain events
  - GET /api/leave-requests с role scoping и фильтрами
  - useLeaveRequests React Query hook
  - substitution-access helpers и auth для switch-user и журнала
affects: [08-03, 08-04, 08-05]

tech-stack:
  added: []
  patterns:
    - "queryLeaveRequests — общий Prisma-query для action и API"
    - "substitution-access в shared для auth без нарушения FSD"
    - "TEACHER switch whitelist из активных Substitutions"

key-files:
  created:
    - src/features/leave-requests/actions/leave-actions.ts
    - src/features/leave-requests/lib/query-leave-requests.ts
    - src/app/api/leave-requests/route.ts
    - src/entities/leave-request/api/use-leave-requests.ts
    - src/entities/leave-request/model/types.ts
    - src/entities/leave-request/index.ts
    - src/shared/lib/substitution-access.ts
  modified:
    - src/features/auth/lib/resolve-switch-access.ts
    - src/features/auth/actions/switch-user-actions.ts
    - src/shared/lib/auth.ts
    - src/shared/lib/authorize-student.ts
    - src/shared/lib/group-access.ts
    - src/shared/lib/authorize-api-request.ts

key-decisions:
  - "LeaveRequestListItem в entities/model/types.ts — FSD: entities не импортируют features"
  - "substitution-access в shared/lib — prisma queries + проверка активности по endDate"
  - "authorize-api-request расширен для substitute-доступа к группам журнала"

patterns-established:
  - "approveLeaveRequest: одна Substitution на весь диапазон в $transaction"
  - "Domain event payload: leaveRequestId, teacherUserId, type, dates, substituteTeacherId"

requirements-completed: [LEAV-01, LEAV-02, LEAV-03, LEAV-04, TCHR-01, TCHR-03, TCHR-04]

duration: 35min
completed: 2026-06-25
---

# Phase 08 Plan 02: Backend заявок и auth замещения Summary

**Server actions заявок с auto-substitution, GET API + React Query, ограничение switch-user и доступ substitute к ученикам журнала**

## Performance

- **Duration:** 35 min
- **Started:** 2026-06-25T00:30:00Z
- **Completed:** 2026-06-25T01:05:00Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Преподаватель создаёт заявку CREATED через `createLeaveRequest` с domain event
- Менеджер одобряет с выбором substitute — создаётся Substitution, dispatch APPROVED + SUBSTITUTION_ACTIVATED
- Отклонение требует rejectionReason min 5 символов
- GET `/api/leave-requests` с IDOR-защитой для TEACHER
- Замещающий переключается только на absent teachers из активных Substitutions
- Substitute получает доступ к ученикам через authorize-student и authorize-api-request

## Task Commits

1. **Task 1: Server actions — create, approve, reject, list** - `063bb71` (feat)
2. **Task 2: GET API и React Query hook** - `5882cbd` (feat)
3. **Task 3: Substitution auth — switch-user и доступ к ученикам** - `d158f66` (feat)

## Files Created/Modified

- `src/features/leave-requests/actions/leave-actions.ts` — CRUD мутации с domain events
- `src/features/leave-requests/lib/query-leave-requests.ts` — общий Prisma query + DTO mapping
- `src/app/api/leave-requests/route.ts` — GET endpoint с role scoping
- `src/entities/leave-request/` — types + useLeaveRequests hook
- `src/shared/lib/substitution-access.ts` — активные замещения и canSubstituteAccessGroup
- `src/features/auth/lib/resolve-switch-access.ts` — TEACHER switch только при Substitution
- `src/features/auth/actions/switch-user-actions.ts` — whitelist switchable users
- `src/shared/lib/auth.ts` — authorize switchOwnerId для TEACHER substitute
- `src/shared/lib/authorize-student.ts` — substitute access к student groups
- `src/shared/lib/group-access.ts` — canAccessGroupAsTeacher async helper
- `src/shared/lib/authorize-api-request.ts` — substitute access в API journal routes

## Decisions Made

- DTO типы списка заявок в `entities/leave-request/model/types.ts` — соблюдение FSD layer rules
- `substitution-access.ts` в shared вместо features — shared не может импортировать features
- Расширен `authorize-api-request` для полного TCHR-04 (журнал через API)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] FSD: типы LeaveRequestListItem перенесены в entities**
- **Found during:** Task 2 (lint)
- **Issue:** `use-leave-requests.ts` импортировал из features — нарушение no-restricted-imports
- **Fix:** Создан `entities/leave-request/model/types.ts`, query re-export типа
- **Files modified:** entities/leave-request/*, query-leave-requests.ts
- **Verification:** `pnpm lint` passed
- **Committed in:** 5882cbd

**2. [Rule 2 - Missing Critical] authorize-api-request для substitute journal access**
- **Found during:** Task 3
- **Issue:** План не включал файл, но journal API (`/api/students`, sessions) использует authorizeApiRequest с groupId check
- **Fix:** TEACHER group/student/completion checks через canAccessGroupAsTeacher
- **Files modified:** src/shared/lib/authorize-api-request.ts
- **Verification:** tsc без ошибок в новых файлах
- **Committed in:** d158f66

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Оба исправления необходимы для корректности FSD и TCHR-04. Семантика плана сохранена.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth | src/shared/lib/auth.ts | Расширен authorize для TEACHER switchOwnerId при активном Substitution |
| threat_flag: api | src/app/api/leave-requests/route.ts | GET endpoint с teacherId IDOR mitigation |

## Issues Encountered

- `pnpm exec tsc --noEmit` падает на pre-existing ошибках в `.next/types` и `StudentSessionsTable.tsx` — не связаны с изменениями плана

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend готов для UI календарей и модалок (plan 08-03+)
- LEAV-01 data layer (query + API) готов для calendar views
- Auth substitution flow готов для E2E smoke tests

---
*Phase: 08-leave-requests*
*Completed: 2026-06-25*

## Self-Check: PASSED

- FOUND: src/features/leave-requests/actions/leave-actions.ts
- FOUND: src/app/api/leave-requests/route.ts
- FOUND: src/shared/lib/substitution-access.ts
- FOUND: commit 063bb71
- FOUND: commit 5882cbd
- FOUND: commit d158f66
