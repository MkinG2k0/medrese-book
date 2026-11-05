# Phase 16: Cashier role & access - Research

**Researched:** 2026-11-05  
**Domain:** RBAC / Prisma Role enum / accounting cash desk (Next.js App Router + Playwright)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Кассир работает в **двух** сценариях: (1) приём наличных на `/accounting/payments` (создание оплаты методом CASH), (2) подтверждение заявок опекуна на `/accounting/payment-requests`, когда метод оплаты при подтверждении — **CASH**. — **Reversibility:** costly — размазано по UI + API guards
- **D-02:** Кассир **не** может подтверждать/проводить CARD/TRANSFER и не работает с расходами, ЗП, ledger, dashboard, month-close, donations (кроме если уже было только у бухгалтера).
- **D-03:** Меню кассира: только **Платежи** и **Заявки на оплату** (и общий shell: выход/профиль по существующим паттернам). Нет дашборда, ЗП, расходов, журнала операций. Default redirect кассира → `/accounting/payments`.
- **D-04:** Middleware / `ROLE_ROUTES`: `CASHIER` allow на `/accounting/payments` и `/accounting/payment-requests`; deny на остальные `/accounting/*` (кроме публичных нерелевантных). ACCOUNTANT без регресса.
- **D-05:** Кассир **может создавать** tuition payment с методом **только CASH** (UI фиксирует/ограничивает метод). CARD/TRANSFER — только бухгалтер.
- **D-06:** Кассир **не** может реверсить/сторнировать платежи — только ACCOUNTANT. Кнопки реверса скрыты; API deny.
- **D-07:** Добавить enum `Role.CASHIER` в Prisma + валидации пользователей + seed тестового кассира для E2E. — **Reversibility:** one-way — Prisma enum migration
- **D-08:** Создание/редактирование пользователей: менеджер/супер-админ может назначить роль Кассир (как сейчас для ACCOUNTANT).

### Claude's Discretion
- Точные тексты меню («Касса» vs «Платежи») — по существующим лейблам accounting, без нового бренда
- Как именно в UI payment-requests ограничить метод для кассира (radio только CASH / скрыть другие) — выбрать паттерн Ant Design рядом с текущим `PaymentRequestsPage`
- Нужен ли кассиру read-only просмотр истории платежей в drawer на payments — да, если уже есть у бухгалтера на той же странице (без реверса)

### Deferred Ideas (OUT OF SCOPE)
- Долг/оплата **по месяцам** и неоплаченные в селекте — Phase 17
- Убрать колонку «Сальдо» — Phase 18
- ЗП формула / UI-конфиг параметров — v3.1
- Партнёр / пожертвования — v3.3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASH-01 | Роль Кассир (`CASHIER`) с доступом к приёму/подтверждению наличных | Prisma `Role` + seed + `ROLE_ROUTES` prefixes + page/API allowlist |
| CASH-02 | Кассир только наличные; остальные accounting-операции недоступны | Longest-prefix deny на `/accounting`; method=CASH guards; reverse deny |
| CASH-03 | ACCOUNTANT сохраняет полный доступ (включая то, что делает кассир) | На всех новых prefixes оставлять `ACCOUNTANT` в allowlist (no fall-through) |
| TEST-01 | Покрывающие тесты на роли кассира | Unit `match-role-route` + E2E cashier vs accountant |
| TEST-04 | Регрессия brownfield tuition/salary сценариев | Не сужать ACCOUNTANT gates; E2E login accountant + payments path smoke |
</phase_requirements>

## Summary

Phase 16 — brownfield RBAC: добавить `Role.CASHIER` и узкий cash-desk контур поверх уже существующей бухгалтерии. Паттерны доступа уже есть: `ROLE_ROUTES` + longest-prefix в `matchRoleRouteAccess`, `requireRole` / `requireRoles` на RSC-страницах, `authorizeApiRequest({ allowedRoles })` на API, `MENU_ORDER_BY_ROLE` в AppShell. Критический урок из текущего кода TEACHER/`/accounting/my-salary`: при добавлении более длинного префикса **обязательно** включать ACCOUNTANT в allowlist этого префикса, иначе бухгалтер потеряет доступ (нет fall-through).

Ограничение метода CASH для кассира нужно **и в UI, и на сервере** (POST payments, batch, confirm request). Сторно остаётся строго ACCOUNTANT: UI скрывает кнопку (`canReverse=false` для кассира), `POST .../reverse` не расширять. Миграция — prod-safe `ALTER TYPE "Role" ADD VALUE 'CASHIER'` (тот же паттерн, что `PARENT` / `ACCOUNTANT`); seed-код кассира — `400002` рядом с бухгалтером `400001`.

**Primary recommendation:** Добавить `CASHIER` через Prisma enum ADD VALUE; в `ROLE_ROUTES` завести явные prefixes `/accounting/payments` и `/accounting/payment-requests` с `['ACCOUNTANT','CASHIER']`; на cash endpoints — dual-role + server-side `method === 'CASH'` для кассира; reverse/export/остальной accounting — ACCOUNTANT-only; unit + Playwright в том же изменении.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role enum persistence | Database / Storage | — | Prisma `Role` + PG enum |
| Route allow/deny by role | Frontend Server (SSR) | Browser | NextAuth `authorized` + `matchRoleRouteAccess` |
| Page RSC gates | Frontend Server (SSR) | — | `requireRoles(['ACCOUNTANT','CASHIER'])` |
| Payment create / batch / history API | API / Backend | Database | `authorizeApiRequest` + method guard |
| Payment reverse API | API / Backend | — | ACCOUNTANT-only |
| Confirm/reject payment requests | API / Backend (server actions) | Frontend Server | `requireRoles` + CASH-only confirm for cashier |
| Menu / default redirect | Browser / Client | Frontend Server | AppShell + `getDefaultRedirect` |
| Method UX lock (CASH) | Browser / Client | API / Backend | Select options + server enforce |
| E2E / unit auth matrix | Test runners | — | Vitest + Playwright |

## Project Constraints (from .cursor/rules/)

| Rule | Directive for Phase 16 |
|------|------------------------|
| `prisma-migrations.mdc` | После правки schema — migration в git; SQL только safe (`ADD VALUE`); на test/prod — `db:migrate:deploy`, запрещены reset/seed/push/migrate dev на shared DB |
| `new-module-tests.mdc` | E2E в том же изменении: roles happy/deny, codes в `e2e/helpers/codes.ts`, локаторы Ant Design через role/cell |
| `antd-app-context.mdc` | Тосты/confirm через `App.useApp()`, не static `message`/`Modal` |
| `antd-no-style-overrides.mdc` | Не хардкодить цвета/типографику antd |
| `no-antd-flex.mdc` | Layout через `div` + Tailwind, не `<Flex>` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.8.0 (project) | Role enum + migration | Existing ORM; ADD VALUE already used for PARENT/ACCOUNTANT `[VERIFIED: package.json / prisma migrations]` |
| NextAuth 5 beta | 5.0.0-beta.30 | JWT role in session | Existing auth; role from DB user `[VERIFIED: CLAUDE.md stack]` |
| Zod | 4.3.6 | `userRoleSchema` + payment schemas | Existing validation layer |
| Vitest | ^4.1.9 | Unit route-guard tests | Existing `match-role-route.test.ts` |
| Playwright | ^1.61.0 | E2E role matrix | Project rule `new-module-tests.mdc` |
| Ant Design | 6.4.3 | Select method lock | Existing payments / payment-requests UI |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/` FSD shared session helpers | — | `requireRoles`, `authorizeApiRequest` | All new dual-role gates |
| React Query | 5.90.x | Payment list/history | Already wired in accounting entities |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dual-role on existing pages | Separate `/cashier/*` routes | Rejected by D-01/D-03 — reuse accounting URLs |
| UI-only method lock | Server-only | Insufficient — need both (D-05) |
| New npm RBAC package | — | Overkill; project already has ROLE_ROUTES |

**Installation:** none — no new packages.

**Version verification:** stack already pinned in repo; no installs this phase.

## Package Legitimacy Audit

> Phase installs **no** external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | N/A |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Current State (codebase)

### Role model
```10:17:prisma/schema.prisma
enum Role {
  SUPER_ADMIN
  MANAGER
  TEACHER
  STUDENT
  ACCOUNTANT
  PARENT
}
```
`PaymentMethod` already includes `CASH | CARD | TRANSFER`. `[VERIFIED: prisma/schema.prisma:10-23]`

### Route matching
```6:24:src/shared/lib/match-role-route.ts
export const ROLE_ROUTES: Record<string, UserRole[]> = {
	'/admin': ['SUPER_ADMIN', 'MANAGER'],
	// ...
	'/accounting': ['ACCOUNTANT'],
	'/accounting/my-salary': ['TEACHER'],
	'/accounting/payment-requests': ['ACCOUNTANT'],
	// ...
}
```
Longest-prefix wins; **no parent fall-through**. `[VERIFIED: src/shared/lib/match-role-route.ts:26-51]`

### Default redirect
ACCOUNTANT → `/accounting`; no CASHIER case (falls to `/dashboard`). `[VERIFIED: src/shared/lib/get-default-redirect.ts:2-18]`

### Cash surfaces today (ACCOUNTANT-only)
| Surface | Gate today |
|---------|------------|
| RSC `/accounting/payments` | `requireRole('ACCOUNTANT')` |
| RSC `/accounting/payment-requests` | `requireRole('ACCOUNTANT')` |
| Server actions list/confirm/reject requests | `requireRole('ACCOUNTANT')` |
| `GET/POST /api/accounting/payments` | `allowedRoles: ['ACCOUNTANT']` |
| `POST /api/accounting/payments/batch` | ACCOUNTANT |
| `GET /api/accounting/payments/history` | ACCOUNTANT |
| `POST /api/accounting/payments/[id]/reverse` | ACCOUNTANT |
| AppShell accountant menu | dashboard, payments, payment-requests, salaries, expenses, ledger |

### UI method controls
- `StudentPaymentsPage`: `Select` with full `PAYMENT_METHOD_OPTIONS`; persists last method in localStorage. `[VERIFIED: StudentPaymentsPage method Select]`
- `PaymentRequestsPage`: default method `TRANSFER`; full options. `[VERIFIED: PaymentRequestsPage.tsx:40]`
- `PaymentHistoryDrawer`: shows reverse when `row.canReverse` (business-rule only, **not** role-aware). `[VERIFIED: query-student-payment-history.ts:56-60]`

### Seed / E2E codes
Accountant `400001` in `prisma/seed.ts`, `prisma/seed-e2e.ts`, `TEST_CODES.accountant`. No cashier. No dedicated accounting payments E2E spec yet (only accountant used in `e2e/messages.spec.ts`).

## Approaches

### Approach A — Dual-role on existing accounting URLs (recommended)
Reuse `/accounting/payments` and `/accounting/payment-requests`. Extend allowlists; constrain method by role. Matches D-01…D-06 exactly.

### Approach B — Separate cashier feature routes
New `/cashier/*` pages. Cleaner isolation, but contradicts locked navigation/URLs and duplicates UI.

### Approach C — ACCOUNTANT + capability flags in DB
Over-engineered for one cash desk role; deferred forever.

**Recommendation:** Approach A.

## Architecture Patterns

### System Architecture Diagram

```text
Login (code)
  → JWT role=CASHIER
  → getDefaultRedirect → /accounting/payments
  → matchRoleRouteAccess(pathname)
        ├─ /accounting/payments*        → allow (ACCOUNTANT|CASHIER)
        ├─ /accounting/payment-requests*→ allow (ACCOUNTANT|CASHIER)
        ├─ /accounting/my-salary*       → TEACHER only (unchanged)
        └─ /accounting* (other)         → ACCOUNTANT only → CASHIER deny→redirect home

Page RSC requireRoles([ACCOUNTANT,CASHIER])
  → Client UI
        ├─ method Select: CASHIER → CASH only
        ├─ history drawer: canReverse=false for CASHIER
        └─ export button: ACCOUNTANT only

Mutations
  → POST /api/accounting/payments(|/batch)
        auth roles + if CASHIER && method≠CASH → 403/error
  → confirmTuitionPaymentRequest
        requireRoles + CASH-only for CASHIER
  → POST .../payments/:id/reverse
        ACCOUNTANT only (unchanged)
```

### Recommended Project Structure (touch points)

```
prisma/
  schema.prisma                          # Role.CASHIER
  migrations/<ts>_add_cashier_role/
    migration.sql                        # ALTER TYPE "Role" ADD VALUE 'CASHIER'
  seed.ts / seed-e2e.ts                  # user code 400002

src/
  entities/user/model/types.ts           # UserRole union
  shared/lib/
    match-role-route.ts (+ .test.ts)
    get-default-redirect.ts
    validations/user.ts
  features/auth/lib/role-labels.ts
  features/user-admin/ui/{CreateUserForm,UsersTable,UserDetailModal}.tsx
  features/accounting/
    ui/{StudentPaymentsPage,PaymentRequestsPage,PaymentHistoryDrawer}.tsx
    actions/payment-request-actions.ts
    lib/ (optional) assert-cashier-cash-method.ts
  app/(dashboard)/
    layout.tsx                           # pending badge for CASHIER
    accounting/payments/page.tsx
    accounting/payment-requests/page.tsx
  app/api/accounting/payments/
    route.ts / batch/route.ts / history/route.ts
    [id]/reverse/route.ts               # DO NOT add CASHIER
  widgets/app-shell/ui/AppShell.tsx

e2e/
  helpers/codes.ts
  cashier-role.spec.ts                   # new
```

### Pattern 1: Longest-prefix dual allowlist
**What:** Explicit longer prefixes that list **both** ACCOUNTANT and CASHIER.  
**When:** Nested routes under a parent owned by another role.  
**Example:**
```typescript
// Source: src/shared/lib/match-role-route.ts (extend existing)
'/accounting': ['ACCOUNTANT'],
'/accounting/my-salary': ['TEACHER'],
'/accounting/payments': ['ACCOUNTANT', 'CASHIER'],
'/accounting/payment-requests': ['ACCOUNTANT', 'CASHIER'],
```

### Pattern 2: Server-side cash-only for cashier
**What:** After Zod parse, reject non-CASH when `session.user.role === 'CASHIER'`.  
**When:** Any payment create / confirm path.  
**Example:**
```typescript
if (session.user.role === 'CASHIER' && parsed.data.method !== 'CASH') {
  return error('Кассир может проводить только наличные', 403)
}
```

### Pattern 3: UI method lock (discretion)
**What:** For cashier, force `method='CASH'`, `Select` disabled or `options={[{value:'CASH',label:'Наличные'}]}`; skip `loadLastPaymentMethod` non-CASH. Prefer disabled Select with single option (closest to current Ant Design Select pattern on both pages) — not Radio, to avoid diverging PaymentRequestsPage layout.  
**When:** `StudentPaymentsPage`, `PaymentRequestsPage`.

### Anti-Patterns to Avoid
- **CASHIER-only prefix without ACCOUNTANT:** breaks CASH-03 (longest-prefix stop).
- **UI-only method lock:** API still accepts CARD/TRANSFER from crafted request.
- **Adding CASHIER to `/accounting`:** opens dashboard/salaries/expenses/ledger via prefix.
- **Adding CASHIER to reverse / export / month-close / donations / salaries APIs.**
- **Seed code collision** with `400001` accountant.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route RBAC | Custom middleware matrix | `matchRoleRouteAccess` + ROLE_ROUTES | Already tested longest-prefix semantics |
| Multi-role page gate | Duplicate pages | `requireRoles([...])` | Exists in `session.ts` |
| API role check | Ad-hoc session parsing | `authorizeApiRequest({ allowedRoles })` | Shared forbidden/unauthorized |
| Enum migration | Manual SQL outside prisma/migrations | Prisma migrate ADD VALUE | Project rule + prior PARENT/ACCOUNTANT |
| E2E login | Copy-paste credentials | `TEST_CODES` + `loginAs` | new-module-tests.mdc |

**Key insight:** The expensive bugs here are RBAC regressions (accountant locked out) and missing server method checks — not new libraries.

## Runtime State Inventory

> Enum **add** (not rename). Inventory for planner awareness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `User.role` PG enum values; no rows use CASHIER yet | Migration ADD VALUE only; seed creates new user rows in dev/e2e |
| Live service config | Dokploy prod DATABASE_URL applies migrations via migrator | Deploy order: migrate → app (prisma-migrations.mdc) |
| OS-registered state | None — verified N/A for Role enum | none |
| Secrets/env vars | None keyed by role name | none |
| Build artifacts | `generated/prisma` client after `prisma generate` | regenerate via migrate/postinstall |

## Common Pitfalls

### Pitfall 1: Longest-prefix ACCOUNTANT regression
**What goes wrong:** Accountant redirected away from `/accounting/payments` after adding CASHIER-only prefix.  
**Why:** `matchRoleRouteAccess` stops on first (longest) match.  
**How to avoid:** Always `['ACCOUNTANT','CASHIER']` on new prefixes; unit tests for both roles on both paths.  
**Warning signs:** E2E accountant cannot open payments.

### Pitfall 2: CASHIER on `/accounting` parent
**What goes wrong:** Cashier reaches dashboard/salaries/expenses/ledger.  
**Why:** `/accounting` prefix matches all children except longer overrides.  
**How to avoid:** Never add CASHIER to `/accounting`; only to payments + payment-requests.

### Pitfall 3: PG enum ADD VALUE + same-txn use
**What goes wrong:** Migration fails with 55P04 if ADD VALUE and using the value (DEFAULT/UPDATE) in one migration file.  
**Why:** PG requires commit before using new enum label. `[CITED: www.postgresql.org/docs/current/sql-altertype.html]`  
**How to avoid:** Migration SQL = **only** `ALTER TYPE "Role" ADD VALUE 'CASHIER';` (mirror `20260926150000_add_parent_role`). Seed runs after migrate in separate process.  
**Warning signs:** P3006/P3018 on migrate deploy.

### Pitfall 4: localStorage last payment method
**What goes wrong:** Cashier UI restores CARD from previous accountant session on same browser.  
**How to avoid:** If role is CASHIER, force CASH and ignore `loadLastPaymentMethod` (or clamp to CASH).

### Pitfall 5: History `canReverse` ignores role
**What goes wrong:** Cashier sees «Сторнировать», API returns 403.  
**How to avoid:** History API (or drawer props) set `canReverse=false` when actor is CASHIER; keep reverse route ACCOUNTANT-only.

### Pitfall 6: Exhaustive `Record<UserRole, …>` compile breaks
**What goes wrong:** TS errors in AppShell, role-labels, CreateUserForm options.  
**How to avoid:** Treat `UserRole` touch list as mandatory compile checklist.

### Pitfall 7: Pending badge / notifications stay ACCOUNTANT-only
**What goes wrong:** Cashier menu shows payment-requests without pending count.  
**How to avoid:** Expand `(dashboard)/layout.tsx` count query to `role in ['ACCOUNTANT','CASHIER']`. Notifying cashiers via messages is **out of menu scope** (D-03); badge is enough for Phase 16.

### Pitfall 8: Seed / E2E code collision
**What goes wrong:** Reusing `400001` or overlapping codes.  
**How to avoid:** `TEST_CODES.cashier = '400002'`; create in both `seed.ts` and `seed-e2e.ts`.

## Code Examples

### ROLE_ROUTES extension
```typescript
// Source: pattern from src/shared/lib/match-role-route.ts:17-19
'/accounting': ['ACCOUNTANT'],
'/accounting/my-salary': ['TEACHER'],
'/accounting/payments': ['ACCOUNTANT', 'CASHIER'],
'/accounting/payment-requests': ['ACCOUNTANT', 'CASHIER'],
```

### Prod-safe migration SQL
```sql
-- Source: prisma/migrations/20260926150000_add_parent_role/migration.sql:1-2
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CASHIER';
```

### Dual-role page gate
```typescript
// Source: src/shared/lib/session.ts:22-25
await requireRoles(['ACCOUNTANT', 'CASHIER'])
```

### Unit tests to add (extend existing file)
```typescript
it('CASHIER на /accounting/payments → allow', () => {
  expect(matchRoleRouteAccess('/accounting/payments', 'CASHIER')).toBe('allow')
})
it('CASHIER на /accounting → deny', () => {
  expect(matchRoleRouteAccess('/accounting', 'CASHIER')).toBe('deny')
})
it('CASHIER на /accounting/salaries → deny', () => {
  expect(matchRoleRouteAccess('/accounting/salaries', 'CASHIER')).toBe('deny')
})
it('ACCOUNTANT на /accounting/payments → allow', () => {
  expect(matchRoleRouteAccess('/accounting/payments', 'ACCOUNTANT')).toBe('allow')
})
```

## ACCOUNTANT-only vs CASHIER allow matrix

| Gate | CASHIER | ACCOUNTANT |
|------|---------|------------|
| `/accounting` dashboard page + API | deny | allow |
| `/accounting/payments` page | allow | allow |
| `/accounting/payment-requests` page | allow | allow |
| `/accounting/salaries|expenses|ledger|my-salary` | deny | per existing |
| POST payments / batch (method CASH) | allow | allow |
| POST payments / batch (CARD/TRANSFER) | **deny** | allow |
| GET payments list / history | allow (read; reverse hidden) | allow |
| POST payments/:id/reverse | **deny** | allow |
| Export payments Excel | **deny** (hide UI) | allow |
| confirm request method CASH | allow | allow |
| confirm request CARD/TRANSFER | **deny** | allow |
| reject request | **allow** (same page workflow; not locked out) `[ASSUMED: discretion — see Open Questions]` | allow |
| expenses/donations/salaries/month-close/charges/ledger/dashboard APIs | deny | allow |
| User admin assign role CASHIER | n/a (manager/super-admin) | n/a |
| AppShell menu | payments, payment-requests, settings | full accountant menu |
| Default redirect | `/accounting/payments` | `/accounting` |
| `canSwitchUser` privileged | **no** (keep as today) | yes |
| MESSAGING_ROLES / news menu | **no** (D-03 narrow menu) | yes |

## File Map (exact touch list)

### Must change
1. `prisma/schema.prisma` — add `CASHIER` to `enum Role`
2. `prisma/migrations/<timestamp>_add_cashier_role/migration.sql` — `ALTER TYPE "Role" ADD VALUE 'CASHIER';`
3. `src/entities/user/model/types.ts` — `UserRole` union
4. `src/shared/lib/validations/user.ts` — `userRoleSchema`
5. `src/shared/lib/match-role-route.ts` — prefixes
6. `src/shared/lib/match-role-route.test.ts` — CASHIER/ACCOUNTANT cases
7. `src/shared/lib/get-default-redirect.ts` — CASHIER → `/accounting/payments`
8. `src/features/auth/lib/role-labels.ts` — `CASHIER: 'Кассир'`
9. `src/features/user-admin/ui/CreateUserForm.tsx` — role option
10. `src/features/user-admin/ui/UsersTable.tsx` — ROLE_OPTIONS
11. `src/features/user-admin/ui/UserDetailModal.tsx` — ROLE_LABELS
12. `src/widgets/app-shell/ui/AppShell.tsx` — `MENU_ORDER_BY_ROLE.CASHIER`
13. `src/app/(dashboard)/layout.tsx` — pending count for CASHIER
14. `src/app/(dashboard)/accounting/payments/page.tsx` — `requireRoles`
15. `src/app/(dashboard)/accounting/payment-requests/page.tsx` — `requireRoles`
16. `src/features/accounting/actions/payment-request-actions.ts` — dual role + CASH guard on confirm
17. `src/app/api/accounting/payments/route.ts` — dual role + CASH guard on POST
18. `src/app/api/accounting/payments/batch/route.ts` — dual role + CASH guard
19. `src/app/api/accounting/payments/history/route.ts` — dual role; force `canReverse=false` for cashier (in route or query helper)
20. `src/features/accounting/ui/StudentPaymentsPage.tsx` — method lock; hide export for cashier; pass role or useSession
21. `src/features/accounting/ui/PaymentRequestsPage.tsx` — method lock to CASH
22. `src/features/accounting/ui/PaymentHistoryDrawer.tsx` — ensure reverse hidden when `canReverse` false (already) / optional role prop
23. `prisma/seed.ts` + `prisma/seed-e2e.ts` — cashier user `400002`
24. `e2e/helpers/codes.ts` — `cashier: '400002'`
25. `e2e/cashier-role.spec.ts` — new E2E

### Must NOT change (ACCOUNTANT-only stay)
- `src/app/api/accounting/payments/[id]/reverse/route.ts`
- dashboard / expenses / donations / ledger / salaries / month-close / charges / export / salary-* routes
- `/accounting` parent ROLE_ROUTES entry (do not add CASHIER)

### Optional / compile-fix sweep
- Any `Record<UserRole, …>` or switch without default that TS flags after union expand
- `src/app/api/uploads/route.ts` / posts allowedRoles — only if cashier needs upload/news (default: skip per D-03)
- `can-switch-user` — leave unchanged (cashier not privileged switcher)

## Test Strategy

### Unit (Vitest)
- Extend `src/shared/lib/match-role-route.test.ts`:
  - CASHIER allow payments + payment-requests
  - CASHIER deny `/accounting`, `/accounting/salaries`, `/accounting/expenses`, `/accounting/ledger`, `/accounting/my-salary`
  - ACCOUNTANT still allow payments + payment-requests + `/accounting`
- Optional small unit for cash-method guard helper if extracted

### E2E (Playwright) — `e2e/cashier-role.spec.ts`
Per `new-module-tests.mdc`:
1. Login cashier → lands on `/accounting/payments` (or redirect)
2. Menu shows «Платежи» and «Заявки на оплату»; no «Зарплаты»/«Расходы»/«Операции»/«Бухгалтерия» dashboard
3. Cashier can open payment-requests; method control is CASH-only
4. Navigate to `/accounting` and `/accounting/salaries` → redirected away (deny)
5. Accountant login → still reaches `/accounting` and payments; method still has CARD/TRANSFER (TEST-04 / CASH-03)
6. Negative: if feasible via UI, cashier cannot see reverse; optional API check that reverse as cashier fails (api helper) — prefer UI assert + keep reverse route ACCOUNTANT

### Commands
| Scope | Command |
|-------|---------|
| Quick unit | `pnpm test:unit src/shared/lib/match-role-route.test.ts` |
| Full unit | `pnpm test:unit` |
| E2E target | `pnpm test:e2e e2e/cashier-role.spec.ts` |
| Full E2E | `pnpm test:e2e` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single ACCOUNTANT for all cash desk | Split CASHIER cash-only vs ACCOUNTANT full | Phase 16 | Narrow RBAC on existing URLs |
| PG enum expand via ADD VALUE | Same (PARENT 2026-09, ACCOUNTANT 2026-07) | Established in repo | Safe additive migration |

**Deprecated/outdated:** none for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cashier **may reject** payment requests (same page); not explicitly in D-01 | Matrix / actions | If product wants reject ACCOUNTANT-only — hide button + keep requireRole ACCOUNTANT on reject |
| A2 | Cashier menu includes `/settings` as «shell/профиль» but not news/messages | AppShell | If settings omitted, profile/theme unreachable — confirm in plan review |
| A3 | Cashier is **not** a privileged switch-user role | can-switch-user | If managers need switch-into-cashier flows differently — extend later |
| A4 | Payment-request created notifications stay ACCOUNTANT-only; cashier relies on badge | Notifications | Cashier may miss alerts without opening the page |

## Open Questions (RESOLVED)

1. **Reject заявки для кассира?** — **RESOLVED: yes**
   - Cashier MAY reject payment requests (same as accountant for reject). Locked at plan-phase.

2. **Settings in cashier menu?** — **RESOLVED: yes (shell)**
   - Include `/settings` in cashier AppShell menu; do NOT add news/messages unless already default for all roles.

*(No other blockers — D-01…D-08 locked.)*

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | app / tests | ✓ (project engines ≥22.12) | per local | — |
| pnpm | scripts | ✓ (lockfile) | 9.x | — |
| PostgreSQL | Role enum migrate | ✓ (docker compose / Neon) | project DB | — |
| Playwright browsers | E2E | project-local | @playwright/test ^1.61 | install via `pnpm exec playwright install` if missing |
| Vitest | unit | ✓ | ^4.1.9 | — |

**Missing dependencies with no fallback:** none identified for planning.  
**Step 2.6 note:** live CLI probes unavailable in this research sandbox; versions taken from repo manifests.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.9 + Playwright ^1.61.0 |
| Config file | `vitest.config.ts`; Playwright via `pnpm test:e2e` |
| Quick run command | `pnpm test:unit src/shared/lib/match-role-route.test.ts` |
| Full suite command | `pnpm test:unit && pnpm test:e2e e2e/cashier-role.spec.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CASH-01 | Role exists; cashier login + cash screens | e2e | `pnpm test:e2e e2e/cashier-role.spec.ts` | ❌ Wave 0 |
| CASH-02 | Deny non-cash routes/methods | unit + e2e | match-role-route tests + e2e deny nav | ⚠️ partial (unit file exists, needs cases) |
| CASH-03 | Accountant still full access | unit + e2e | match-role-route ACCOUNTANT + e2e accountant path | ⚠️ extend |
| TEST-01 | Role coverage | unit + e2e | above | ❌ Wave 0 gaps |
| TEST-04 | No accountant regression | e2e smoke | cashier-role.spec accountant case | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test:unit src/shared/lib/match-role-route.test.ts`
- **Per wave merge:** `pnpm test:unit` + `pnpm test:e2e e2e/cashier-role.spec.ts`
- **Phase gate:** Full unit green + cashier E2E green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `e2e/cashier-role.spec.ts` — CASH-01/02/03 + TEST-01/04
- [ ] Extend `src/shared/lib/match-role-route.test.ts` — CASHIER matrix
- [ ] Seed `400002` + `TEST_CODES.cashier` — prerequisite for E2E
- [ ] (Optional) helper unit `assert-cashier-cash-method` if extracted

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth credentials + JWT |
| V3 Session Management | yes | JWT role claim; middleware authorized |
| V4 Access Control | **yes (primary)** | ROLE_ROUTES + requireRoles + authorizeApiRequest |
| V5 Input Validation | yes | Zod payment/request schemas + method enum |
| V6 Cryptography | no | — |

### Known Threat Patterns for cash RBAC

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation via forged method CARD as cashier | Elevation | Server-side role+method check on create/confirm/batch |
| Direct URL to `/accounting/salaries` | Elevation | Longest-prefix deny + RSC requireRole |
| Call reverse API as cashier | Tampering / Elevation | Keep `allowedRoles: ['ACCOUNTANT']`; hide UI |
| IDOR on payment history studentId | Information disclosure | Existing accountant-grade access; cashier same read scope as payments page (trusted staff) — no new public exposure |
| Mass assignment role on self-register | Elevation | Role assign only via user-admin (manager/super-admin) |

## Sources

### Primary (HIGH confidence)
- In-repo files listed in CONTEXT canonical refs (Read this session)
- Context7 `/websites/prisma_io` — `addNativeEnumValue` → `ALTER TYPE ... ADD VALUE`
- Existing migrations: `20260926150000_add_parent_role`, `20260703234139_accounting_module`

### Secondary (MEDIUM confidence)
- PostgreSQL ALTER TYPE notes on ADD VALUE transaction commit requirement `[CITED: www.postgresql.org/docs/current/sql-altertype.html]`
- Prisma GitHub issues on enum ADD VALUE + DEFAULT same migration (avoid for this phase — we only ADD VALUE)

### Tertiary (LOW confidence)
- A1–A4 product micro-decisions (reject / settings / switch / notifications)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse existing project libs, no new deps
- Architecture: HIGH — ROLE_ROUTES / requireRoles / authorizeApiRequest verified in source
- Pitfalls: HIGH — longest-prefix regression proven by existing my-salary tests; enum ADD VALUE pattern proven in repo

**Research date:** 2026-11-05  
**Valid until:** 2026-12-05 (stable brownfield RBAC; re-check if ROLE_ROUTES refactored)
