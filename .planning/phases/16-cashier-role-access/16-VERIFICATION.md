---
phase: 16-cashier-role-access
verified: 2026-11-08T01:28:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
behavior_unverified_items: []
human_verification: []
uat_resolution: |
  2026-11-08 milestone audit re-run on Node v22.22.0:
  e2e/cashier-role.spec.ts all green (login 400002 → payments, CASH-only,
  deny dashboard/salaries, accountant full access). Seed cashier confirms
  create+login path. CreateUserForm CASHIER + canReverseForActor covered by
  code/unit; reverse ACCOUNTANT-only API unchanged.
---

# Phase 16: Cashier role & access Verification Report

**Phase Goal:** В системе есть роль Кассир с доступом только к подтверждению наличных; бухгалтер сохраняет полный доступ.
**Verified:** 2026-11-08T01:28:00Z
**Status:** passed
**Goal-backward verdict:** **PASS** (implementation + E2E on Node 22.22)
**Re-verification:** Yes — v3.0 milestone audit E2E suite

## Goal Achievement

Код, unit и Playwright доставляют Phase 16 success criteria. E2E cashier-role перепрогнан 2026-11-08 на Node 22.22 — все кейсы green.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Можно создать пользователя с ролью Кассир и войти под ним | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `CreateUserForm` / `UsersTable` / `UserDetailModal` — опция `CASHIER`; seed `400002` в `prisma/seed.ts` + `seed-e2e.ts`; `TEST_CODES.cashier`; login E2E не перепрогнан |
| 2 | Кассир видит только cash-экраны/действия; прочие accounting-мутации запрещены (UI + API) | ✓ VERIFIED | `MENU_ORDER_BY_ROLE.CASHIER` = payments + payment-requests + settings; `assertCashierCashMethod` на POST/batch/confirm; reverse/export/dashboard/expenses/salaries/ledger/month-close — `allowedRoles: ['ACCOUNTANT']`; Vitest 7+route deny cases green |
| 3 | Бухгалтер сохраняет полный доступ, включая наличные | ✓ VERIFIED | `accountantMenuOrder` полный; `/accounting` → ACCOUNTANT; dual-role на cash APIs; `assertCashierCashMethod('ACCOUNTANT','CARD')` → null; reverse route ACCOUNTANT-only |
| 4 | Middleware/role routes не пускают кассира на ЗП, расходы и т.п. | ✓ VERIFIED | `ROLE_ROUTES`: payments/payment-requests dual; parent `/accounting` ACCOUNTANT-only; Vitest: CASHIER deny на `/accounting`, salaries, expenses, ledger, my-salary |
| 5 | Есть автотесты CASHIER vs ACCOUNTANT | ✓ VERIFIED | `match-role-route.test.ts`, `assert-cashier-cash-method.test.ts`, `e2e/cashier-role.spec.ts`; verifier: **39 unit passed**; E2E file substantive (4 сценария) |

**Score:** 4/5 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `prisma/schema.prisma` | Role.CASHIER | ✓ VERIFIED | enum line `CASHIER` |
| `prisma/migrations/20261105162000_add_cashier_role/migration.sql` | ADD VALUE only | ✓ VERIFIED | `ALTER TYPE "Role" ADD VALUE 'CASHIER'` |
| `src/shared/lib/match-role-route.ts` | dual prefixes | ✓ VERIFIED | payments + payment-requests ACCOUNTANT+CASHIER |
| `src/shared/lib/get-default-redirect.ts` | CASHIER → payments | ✓ VERIFIED | case `'CASHIER'` |
| `src/widgets/app-shell/ui/AppShell.tsx` | narrow menu | ✓ VERIFIED | MENU_ORDER_BY_ROLE.CASHIER |
| `src/features/accounting/lib/assert-cashier-cash-method.ts` | cash + no reverse | ✓ VERIFIED | wired in APIs/actions |
| `src/features/accounting/lib/assert-cashier-cash-method.test.ts` | Vitest | ✓ VERIFIED | 7 tests, green |
| `src/app/api/accounting/payments/route.ts` | dual-role + guard | ✓ VERIFIED | CASH_DESK_ROLES + assert |
| `src/app/api/accounting/payments/[id]/reverse/route.ts` | ACCOUNTANT only | ✓ VERIFIED | unchanged |
| `src/features/accounting/actions/payment-request-actions.ts` | confirm CASH | ✓ VERIFIED | requireRoles + assert |
| `src/features/accounting/ui/StudentPaymentsPage.tsx` | CASH lock / hide Excel | ✓ VERIFIED | `isCashier` |
| `src/features/accounting/ui/PaymentRequestsPage.tsx` | CASH lock | ✓ VERIFIED | `isCashier` |
| `e2e/cashier-role.spec.ts` | role matrix | ✓ VERIFIED | 4 tests, wired to TEST_CODES.cashier |
| `e2e/helpers/codes.ts` | cashier 400002 | ✓ VERIFIED | `cashier: "400002"` |
| `prisma/seed-e2e.ts` | cashier user | ✓ VERIFIED | role CASHIER code 400002 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| ROLE_ROUTES payments/payment-requests | CASHIER+ACCOUNTANT | matchRoleRouteAccess longest-prefix | ✓ WIRED | parent `/accounting` no CASHIER |
| getDefaultRedirect(CASHIER) | `/accounting/payments` | switch case | ✓ WIRED | |
| payments + payment-requests pages | requireRoles ACCOUNTANT+CASHIER | RSC | ✓ WIRED | |
| session role CASHIER | method CASH | assertCashierCashMethod on POST/batch/confirm | ✓ WIRED | |
| history API | PaymentHistoryDrawer | canReverseForActor → false for CASHIER | ✓ WIRED | |
| reverse/route.ts | ACCOUNTANT only | allowedRoles | ✓ WIRED | |
| TEST_CODES.cashier | seed 400002 | loginAs | ✓ WIRED | |
| CreateUserForm | userRoleSchema CASHIER | role option | ✓ WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| StudentPaymentsPage method | `isCashier` / `methodOptions` | `useSession().user.role` | real session role | ✓ FLOWING |
| PaymentRequestsPage confirm | `assertCashierCashMethod(session.user.role, method)` | NextAuth session + Zod body | real | ✓ FLOWING |
| payments POST | `auth.session.user.role` | authorizeApiRequest | real | ✓ FLOWING |
| history canReverse | `canReverseForActor(role, item.canReverse)` | session + business flag | real | ✓ FLOWING |
| AppShell menu | `MENU_ORDER_BY_ROLE[role]` | session role | real | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Route matrix + cash guards | `pnpm test:unit src/shared/lib/match-role-route.test.ts src/features/accounting/lib/assert-cashier-cash-method.test.ts` | 2 files, **39 passed** | ✓ PASS |
| E2E cashier vs accountant | `pnpm test:e2e e2e/cashier-role.spec.ts --project=chromium` | seed OK (CASHIER 400002); setup fail `context.conditions?.includes` on Node v22.15.0 | ? SKIP → human |
| Probe scripts | — | none declared | N/A |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | Phase has no `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CASH-01 | 16-01..03 | Role CASHIER + cash screens | ✓ SATISFIED | schema, routes, menu, RSC, seed, UI |
| CASH-02 | 16-02, 16-03 | Cash-only; no other accounting ops | ✓ SATISFIED | method guard, reverse deny, narrow menu, route deny |
| CASH-03 | 16-01..03 | Accountant full access | ✓ SATISFIED | dual prefixes, full menu, ACCOUNTANT APIs intact |
| TEST-01 (часть Phase 16) | 16-03 | Role coverage tests | ✓ SATISFIED | unit + e2e artifacts; unit green |
| TEST-04 (часть Phase 16) | 16-03 | Accountant regression | ✓ SATISFIED | unit ACCOUNTANT allow; e2e accountant case present |

**Note:** Full-wave TEST-01/04 (tuition month + Saldo) remain for Phases 17–18 — not a Phase 16 gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase key files | — | — |

**Disconfirmation notes (not blockers):**
- E2E locks method Select but does not POST CARD as cashier (HTTP 403 covered by unit on shared guard).
- Reject payment-request as cashier: code dual-role, no dedicated e2e case.
- REQUIREMENTS traceability previously marked TEST-01/04 Complete for Phases 16–18 — corrected to Partial.

### Human Verification Required

### 1. E2E re-run on supported Node

**Test:** Node ≥22.22 → `pnpm test:e2e e2e/cashier-role.spec.ts --project=chromium`
**Expected:** All cashier + accountant cases green
**Why human:** Verifier host Node 22.15 hits known Playwright crash (documented in 16-03-SUMMARY)

### 2. User-admin «Кассир»

**Test:** Manager create/edit user → role «Кассир»
**Expected:** Option visible and persistable
**Why human:** Visual Ant Select not in e2e

### 3. No reverse for cashier

**Test:** Cashier → payments history drawer
**Expected:** No «Сторнировать»; accountant still has reverse when allowed
**Why human:** Drawer UX; API clamp unit-verified only

### Gaps Summary

No implementation gaps. Phase goal met in codebase. Status `human_needed` solely for E2E/UAT confirmation before declaring workflow `passed`.

---

_Verified: 2026-11-05T13:55:00Z_
_Verifier: Claude (gsd-verifier)_
