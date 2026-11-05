---
phase: 16-cashier-role-access
plan: 01
subsystem: auth
tags: [prisma, postgres-enum, rbac, nextauth, antd, vitest]

requires: []
provides:
  - Role.CASHIER Prisma enum + UserRole/Zod
  - ROLE_ROUTES dual-allow for /accounting/payments and /accounting/payment-requests
  - getDefaultRedirect(CASHIER) → /accounting/payments
  - AppShell MENU_ORDER_BY_ROLE.CASHIER (payments, payment-requests, settings)
  - RSC requireRoles ACCOUNTANT+CASHIER on cash-desk pages
affects:
  - 16-02 (API/action guards for CASHIER)
  - 16-03 (seed, user-admin, full route matrix)

actuals:
  tokens: 4200
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "PostgreSQL Role enum via ALTER TYPE ADD VALUE only (create-only migration file)"
    - "Longest-prefix ROLE_ROUTES: child prefixes for CASHIER, parent /accounting stays ACCOUNTANT-only"

key-files:
  created:
    - prisma/migrations/20261105162000_add_cashier_role/migration.sql
    - .planning/phases/16-cashier-role-access/16-01-SUMMARY.md
  modified:
    - prisma/schema.prisma
    - src/entities/user/model/types.ts
    - src/shared/lib/validations/user.ts
    - src/shared/lib/match-role-route.ts
    - src/shared/lib/match-role-route.test.ts
    - src/shared/lib/get-default-redirect.ts
    - src/widgets/app-shell/ui/AppShell.tsx
    - src/app/(dashboard)/accounting/payments/page.tsx
    - src/app/(dashboard)/accounting/payment-requests/page.tsx
    - src/features/auth/lib/role-labels.ts

key-decisions:
  - "Checkpoint add-cashier-enum approved — D-07 one-way Role.CASHIER ADD VALUE"
  - "Migration created as SQL file only (ADD VALUE) without migrate deploy on shared DB"
  - "Minimal role-labels CASHIER=Кассир so Record<UserRole> tsc passes (full admin UI in 16-03)"

patterns-established:
  - "CASHIER never listed on /accounting parent prefix — only payments + payment-requests"
  - "Cash-desk RSC pages use requireRoles(['ACCOUNTANT','CASHIER'])"

requirements-completed: [CASH-01, CASH-03]

coverage:
  - id: D1
    description: Role.CASHIER exists in Prisma schema and ADD VALUE migration
    requirement: CASH-01
    verification:
      - kind: other
        ref: "pnpm exec prisma validate"
        status: pass
    human_judgment: false
  - id: D2
    description: CASHIER allow payments; deny /accounting parent; ACCOUNTANT keep payments
    requirement: CASH-03
    verification:
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#CASHIER на /accounting/payments → allow"
        status: pass
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#CASHIER на /accounting → deny"
        status: pass
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#ACCOUNTANT на /accounting/payments → allow"
        status: pass
    human_judgment: false
  - id: D3
    description: Default redirect and RSC gates accept CASHIER; AppShell narrow menu
    requirement: CASH-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-05
status: complete
---

# Phase 16 Plan 01: Cashier role access Summary

**Role.CASHIER wired end-to-end for cash-desk navigation: enum migration, dual ROLE_ROUTES prefixes, redirect, RSC gates, and narrow AppShell menu.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-05T13:19:00Z
- **Completed:** 2026-11-05T13:31:00Z
- **Tasks:** 2 (decision checkpoint pre-approved + tracer)
- **Files modified:** 11

## Accomplishments

- Added irreversible `Role.CASHIER` via Prisma enum + `ALTER TYPE "Role" ADD VALUE 'CASHIER'`
- Middleware longest-prefix: ACCOUNTANT+CASHIER on payments/payment-requests; CASHIER denied on `/accounting`
- Cashier home `/accounting/payments`; menu Платежи / Заявки на оплату / Настройки; both RSC pages accept ACCOUNTANT+CASHIER

## Task Commits

1. **Task 1: Confirm one-way Role.CASHIER enum migration (D-07)** - pre-approved `add-cashier-enum` (no commit)
2. **Task 2: End-to-end CASHIER reaches /accounting/payments** - `3fdbf79` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `prisma/schema.prisma` — `CASHIER` in Role enum
- `prisma/migrations/20261105162000_add_cashier_role/migration.sql` — ADD VALUE only
- `src/entities/user/model/types.ts` — UserRole union
- `src/shared/lib/validations/user.ts` — Zod userRoleSchema
- `src/shared/lib/match-role-route.ts` — dual-role prefixes
- `src/shared/lib/match-role-route.test.ts` — tracer smoke
- `src/shared/lib/get-default-redirect.ts` — CASHIER → payments
- `src/app/(dashboard)/accounting/payments/page.tsx` — requireRoles
- `src/app/(dashboard)/accounting/payment-requests/page.tsx` — requireRoles
- `src/widgets/app-shell/ui/AppShell.tsx` — MENU_ORDER_BY_ROLE.CASHIER
- `src/features/auth/lib/role-labels.ts` — label «Кассир» (tsc exhaustiveness)

## Decisions Made

- Proceeded with **add-cashier-enum** per user-approved checkpoint and locked D-07
- Migration file created manually (create-only style) — not applied via `migrate deploy` in this plan
- Touched `role-labels.ts` outside plan file list so `Record<UserRole>` compiles

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exhaustive UserRole map in role-labels**
- **Found during:** Task 2 (tracer verify / tsc)
- **Issue:** Adding CASHIER to UserRole broke `Record<UserRole, string>` in role-labels (deferred to 16-03 by plan, but verify requires tsc)
- **Fix:** Added `CASHIER: 'Кассир'`
- **Files modified:** `src/features/auth/lib/role-labels.ts`
- **Verification:** `pnpm exec tsc --noEmit` exit 0
- **Committed in:** `3fdbf79`

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Necessary for verify gate; no scope creep into user-admin/seed (still 16-03)

## Issues Encountered

- `node_modules` missing on executor host — ran `pnpm install` before verify
- PowerShell treats `(dashboard)` path segments as command groups — git add used quoted paths

## User Setup Required

None - no external service configuration required. Deploy note: run `pnpm db:migrate:deploy` on test/prod before shipping app code that assigns Role.CASHIER.

## Next Phase Readiness

- Ready for **16-02** (API/action authorization for CASHIER cash flows)
- Seed cashier user + full route matrix + user-admin role select remain in **16-03**
- Enum migration not yet applied to remote DB from this session

## Verify Results

- `pnpm exec prisma validate` — pass
- `pnpm test:unit src/shared/lib/match-role-route.test.ts` — 26 passed
- `pnpm exec tsc --noEmit -p tsconfig.json` — pass

## Self-Check: PASSED

- FOUND: prisma/migrations/20261105162000_add_cashier_role/migration.sql
- FOUND: 16-01-SUMMARY.md
- FOUND: commit 3fdbf79

---
*Phase: 16-cashier-role-access*
*Completed: 2026-11-05*
