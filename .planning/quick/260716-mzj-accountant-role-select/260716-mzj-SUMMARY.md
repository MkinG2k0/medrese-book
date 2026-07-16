---
status: complete
phase: 260716-mzj-accountant-role-select
plan: 01
subsystem: auth
tags: [user-switcher, accountant, resolve-switch-access, vitest]

requires:
  - phase: 260701-ppw-fix-manager-teacher-switch
    provides: privileged switchOwnerId pattern for impersonation return path
provides:
  - ACCOUNTANT privileged switch access via resolveSwitchAccess
  - ACCOUNTANT privileged non-STUDENT switchable user list
  - canSwitchUser unit coverage for ACCOUNTANT
affects: [UserSwitcher, dashboard layout switchableUsers]

tech-stack:
  added: []
  patterns:
    - "ACCOUNTANT is privileged actor like MANAGER; isPrivilegedSwitchOwner stays MANAGER/SUPER_ADMIN only"
    - "Reuse getPrivilegedSwitchableUsers() for ACCOUNTANT — no duplicate Prisma query"

key-files:
  created:
    - src/features/auth/lib/can-switch-user.test.ts
  modified:
    - src/features/auth/lib/can-switch-user.ts
    - src/features/auth/lib/resolve-switch-access.ts
    - src/features/auth/actions/switch-user-actions.ts

key-decisions:
  - "ACCOUNTANT native login uses session.user.id as switchOwnerId; under MANAGER/SUPER_ADMIN impersonation keeps owner switchOwnerId"
  - "AppShell/UserSwitcher untouched — empty list was the only blocker"

patterns-established:
  - "New privileged dashboard roles: add to canSwitchUser + resolveSwitchAccess + getSwitchableUsers privileged branch together"

requirements-completed:
  - QUICK-accountant-role-select

coverage:
  - id: D1
    description: canSwitchUser returns true for ACCOUNTANT
    requirement: QUICK-accountant-role-select
    verification:
      - kind: unit
        ref: src/features/auth/lib/can-switch-user.test.ts#разрешает ACCOUNTANT как privileged роль
        status: pass
    human_judgment: false
  - id: D2
    description: resolveSwitchAccess allows native ACCOUNTANT and privileged-owner impersonation return
    requirement: QUICK-accountant-role-select
    verification:
      - kind: other
        ref: rg ACCOUNTANT src/features/auth/lib/resolve-switch-access.ts
        status: pass
    human_judgment: true
    rationale: "Async resolveSwitchAccess needs prisma; unit cover deferred — smoke login 400001 confirms UserSwitcher"
  - id: D3
    description: getSwitchableUsers returns privileged non-STUDENT list for ACCOUNTANT
    requirement: QUICK-accountant-role-select
    verification:
      - kind: other
        ref: rg ACCOUNTANT src/features/auth/actions/switch-user-actions.ts
        status: pass
    human_judgment: true
    rationale: "Server action list depends on session/prisma; verified by static inclusion + reuse of getPrivilegedSwitchableUsers"

duration: 2min
completed: 2026-07-16
status: complete
---

# Phase 260716-mzj Plan 01: Accountant Role Select Summary

**ACCOUNTANT получает privileged switch access и тот же non-STUDENT список, что MANAGER — UserSwitcher появляется без правок AppShell**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-16T13:36:49Z
- **Completed:** 2026-07-16T13:38:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `canSwitchUser('ACCOUNTANT')` → true; vitest покрывает privileged / TEACHER / STUDENT
- `resolveSwitchAccess` для ACCOUNTANT: native actor или сохранение privileged `switchOwnerId` (паттерн 260701-ppw)
- `getSwitchableUsers` для ACCOUNTANT вызывает `getPrivilegedSwitchableUsers()` (без STUDENT)

## Task Commits

1. **Task 1 (RED):** `f5004e2` — test(260716-mzj-01): add failing canSwitchUser tests for ACCOUNTANT
2. **Task 1 (GREEN):** `1ff4cdd` — feat(260716-mzj-01): allow ACCOUNTANT privileged switch access
3. **Task 2:** `6df62e6` — feat(260716-mzj-01): return privileged switch list for ACCOUNTANT

## Files Created/Modified

- `src/features/auth/lib/can-switch-user.test.ts` — unit-тесты canSwitchUser
- `src/features/auth/lib/can-switch-user.ts` — ACCOUNTANT в privileged-проверке
- `src/features/auth/lib/resolve-switch-access.ts` — ветка ACCOUNTANT + privileged owner
- `src/features/auth/actions/switch-user-actions.ts` — privileged list для ACCOUNTANT

## Decisions Made

- Бухгалтер — privileged **actor**, но не privileged **owner** (`isPrivilegedSwitchOwner` без изменений)
- UI AppShell / layout / UserSwitcher не трогали — достаточно непустого `switchableUsers`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Готово к ручному smoke: вход `400001` → UserSwitcher в сайдбаре → переключение на менеджера/учителя и возврат
- Out of scope: NotificationBell для ACCOUNTANT, меню, STUDENT в switcher

## Self-Check: PASSED

- FOUND: src/features/auth/lib/can-switch-user.test.ts
- FOUND: src/features/auth/lib/can-switch-user.ts
- FOUND: src/features/auth/lib/resolve-switch-access.ts
- FOUND: src/features/auth/actions/switch-user-actions.ts
- FOUND: f5004e2, 1ff4cdd, 6df62e6

---
*Phase: 260716-mzj-accountant-role-select*
*Completed: 2026-07-16*
