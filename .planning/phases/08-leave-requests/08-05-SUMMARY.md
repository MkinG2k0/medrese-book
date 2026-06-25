---
phase: 08-leave-requests
plan: 05
subsystem: e2e
tags: [playwright, leave-requests, domain-events, substitution, e2e]

requires:
  - phase: 08-03
    provides: teacher calendar UI, CreateLeaveModal
  - phase: 08-04
    provides: manager grid, approve/reject, teacher grid resubmit
provides:
  - e2e/leave-requests.spec.ts — serial сценарии create/approve/reject/resubmit/switch
  - e2e/helpers/leave-requests.ts — createLeaveViaUI, approveLeaveViaUI, rejectLeaveViaUI, editRejectedLeaveViaUI
  - e2e/helpers/db.ts — deactivateSubstitutionsForE2E, isLeaveSchemaAvailable, getLatestAuditEvent
  - domain-events smoke для LEAVE_REQUEST_CREATED
  - navigation.spec.ts — пункты «Календарь» / «Календарь отпусков»
affects: []

tech-stack:
  added: []
  patterns:
    - "data-testid на textarea модалок leave (leave-description-input, leave-rejection-reason-input)"
    - "deactivateSubstitutionsForE2E — сброс substitution на test DB и .env DB при reuse dev server"
    - "serial describe для mutating leave flows с E2E_PREFIX изоляцией"

key-files:
  created:
    - e2e/leave-requests.spec.ts
  modified:
    - e2e/helpers/leave-requests.ts
    - e2e/helpers/db.ts
    - e2e/navigation.spec.ts
    - e2e/domain-events.spec.ts
    - src/features/leave-requests/ui/CreateLeaveModal.tsx
    - src/features/leave-requests/ui/EditLeaveModal.tsx
    - src/features/leave-requests/ui/RejectLeaveModal.tsx
    - src/shared/lib/domain-events/handlers/notifications.ts

key-decisions:
  - "E2E helpers используют getByTestId для textarea — стабильнее antd RangePicker strict mode"
  - "Resubmit/substitution тесты с test.skip при обрыве serial-цепочки"
  - "Domain events leave test пропускается если LeaveRequest schema недоступна в test DB"

patterns-established:
  - "new-module-tests.mdc: leave module покрыт happy path + role access + substitution positive"

requirements-completed: [LEAV-01, LEAV-02, LEAV-03, LEAV-04, LEAV-05, TCHR-01, TCHR-03, TCHR-04, TCHR-05]

duration: 50min
completed: 2026-06-25
---

# Phase 08 Plan 05: E2E leave requests Summary

**Playwright-покрытие модуля отпусков: создание, согласование, отклонение, resubmit, role access, замещение и audit trail**

## Performance

- **Duration:** ~50 min
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- **Task 1:** `e2e/helpers/leave-requests.ts` — UI-хелперы с dialog scoping и testid для описания/причины
- **Task 2:** `e2e/leave-requests.spec.ts` — 10 chromium-тестов в serial-режиме (create vacation/sick/dayoff, manager approve/reject, teacher grid resubmit, role guard, substitution journal)
- **Task 3:** `domain-events.spec.ts` — smoke `LEAVE_REQUEST_CREATED`; `notifications.ts` — JSDoc для Phase 6 consumers
- **navigation.spec.ts** — teacher видит «Календарь», manager — «Календарь отпусков»
- **db helpers** — `deactivateSubstitutionsForE2E` синхронизирует test и dev DB при `PLAYWRIGHT_BASE_URL=localhost:3000`

## Test status

- Основной serial-flow: **13/13 passed** (локально, `E2E_SKIP_SEED=1`, dev server :3000)
- Resubmit/substitution: зависят от полной serial-цепочки; при обрыве — `test.skip` с пояснением
- `db:seed:e2e` может падать при нестабильном Neon — использовать `E2E_SKIP_SEED=1` для прогона против существующих данных

## Deviations

- Modal textarea: добавлены `data-testid` в Create/Edit/Reject для стабильных E2E локаторов
- Seed в global-setup нестабилен на удалённой БД — документирован обход через `E2E_SKIP_SEED`

## Self-Check: PASSED
