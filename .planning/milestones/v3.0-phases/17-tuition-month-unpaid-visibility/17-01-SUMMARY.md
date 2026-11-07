---
phase: 17-tuition-month-unpaid-visibility
plan: 01
subsystem: payments
tags: [prisma, tuition, month, zod, parent-portal, accounting]

requires:
  - phase: 16-cashier-role-access
    provides: CASH_DESK_ROLES, cashier cash method assert, payments API dual-role
provides:
  - TuitionPayment.month and TuitionPaymentRequest.month (YYYY-MM) with Moscow backfill migration
  - Zod month required on create/request/batch
  - confirm copies request.month from DB via paymentMonthFromRequest
  - monthPaidKopecks by payment.month (sumPaidForAttributionMonth)
  - ParentPayForm month Select + cash desk POST bodies include month
affects:
  - 17-02 unpaid yellow select
  - 17-03 debts page
  - 17-04 E2E tuition-month

actuals:
  tokens: 5157
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - expand SQL nullable ADD → Moscow to_char backfill → SET NOT NULL + indexes
    - paymentMonthFromRequest for confirm attribution (DB month only)
    - sumPaidForAttributionMonth for monthPaid vs calendar date

key-files:
  created:
    - prisma/migrations/20261105190000_tuition_payment_month/migration.sql
    - src/features/accounting/lib/month-paid-attribution.ts
    - src/shared/lib/validations/tuition-payment-create.test.ts
    - src/features/accounting/lib/month-paid-attribution.test.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/validations/accounting.ts
    - src/shared/lib/validations/tuition-payment-request.test.ts
    - src/features/accounting/lib/accounting-mutations.ts
    - src/features/accounting/lib/query-student-payments.ts
    - src/features/accounting/actions/payment-request-actions.ts
    - src/features/parent-portal/actions/parent-payment-actions.ts
    - src/features/parent-portal/ui/ParentPayForm.tsx
    - src/features/parent-portal/lib/parent-pay-draft.ts
    - src/features/accounting/ui/StudentPaymentsPage.tsx

key-decisions:
  - "Checkpoint: apply-month-migration — expand SQL for TuitionPayment.month and TuitionPaymentRequest.month (user pre-approved 2026-11-05)"
  - "Migration created as committed SQL only (DATABASE_URL remote); apply via pnpm db:migrate:deploy on test/prod"
  - "Confirm uses paymentMonthFromRequest(request.month) from DB row — never client body month"

patterns-established:
  - "Attribution month is explicit payment.month, not payment.date calendar month"
  - "Parent request stores one month for all lines; confirm copies that month to each TuitionPayment"

requirements-completed: [TUITION-01, TEST-01, TEST-04]

coverage:
  - id: D1
    description: Zod require month on request + create/batch schemas
    requirement: TUITION-01
    verification:
      - kind: unit
        ref: src/shared/lib/validations/tuition-payment-request.test.ts
        status: pass
      - kind: unit
        ref: src/shared/lib/validations/tuition-payment-create.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: monthPaid attribution by payment.month when calendar date differs
    requirement: TEST-01
    verification:
      - kind: unit
        ref: src/features/accounting/lib/month-paid-attribution.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Confirm copies DB request.month via paymentMonthFromRequest
    requirement: TUITION-01
    verification:
      - kind: unit
        ref: src/features/accounting/lib/month-paid-attribution.test.ts#paymentMonthFromRequest
        status: pass
    human_judgment: false
  - id: D4
    description: Moscow backfill migration SQL committed (deploy separately)
    requirement: TUITION-01
    verification:
      - kind: other
        ref: pnpm exec prisma validate
        status: pass
    human_judgment: false
    rationale: Shared DB not mutated from executor; deploy with migrate:deploy

duration: 12min
completed: 2026-11-05
status: complete
---

# Phase 17 Plan 01: Tuition month tracer Summary

**Explicit YYYY-MM on TuitionPaymentRequest + TuitionPayment with Moscow backfill, parent/cash write paths, confirm from DB month, and monthPaid by payment.month.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-11-05T18:02:10Z
- **Completed:** 2026-11-05T18:08:00Z
- **Tasks:** 3/3 (checkpoint pre-approved + Wave 0 RED + tracer GREEN)
- **Files modified:** 14

## Accomplishments

- Schema + expand migration: nullable `month` → Moscow `to_char` backfill → `NOT NULL` + indexes
- Parent submit persists one `month`; confirm copies `request.month` from DB (`paymentMonthFromRequest`)
- `queryStudentPaymentsForMonth` sums via `sumPaidForAttributionMonth` on `payment.month`
- Create/batch Zod reject missing month; ParentPayForm Select + StudentPaymentsPage POST include month
- Wave 0 unit tests RED then GREEN; `prisma validate` + `tsc --noEmit` clean

## Task Commits

1. **Checkpoint: apply-month-migration** — pre-approved by user 2026-11-05 (no commit; decision recorded here)
2. **Task Wave 0 unit scaffolds** — `1ed2598` (test)
3. **Task Tracer end-to-end month** — `a93ae06` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `prisma/schema.prisma` — `month` on TuitionPayment + TuitionPaymentRequest + indexes
- `prisma/migrations/20261105190000_tuition_payment_month/migration.sql` — expand + Moscow backfill
- `src/shared/lib/validations/accounting.ts` — required `month` on create/request/batch
- `src/features/accounting/lib/month-paid-attribution.ts` — pure attribution helpers
- `src/features/accounting/lib/query-student-payments.ts` — monthPaid by payment.month
- `src/features/accounting/lib/accounting-mutations.ts` — write/reverse month
- `src/features/accounting/actions/payment-request-actions.ts` — confirm copies DB month
- `src/features/parent-portal/actions/parent-payment-actions.ts` — persist request.month
- `src/features/parent-portal/ui/ParentPayForm.tsx` — month Select (plain options)
- `src/features/parent-portal/lib/parent-pay-draft.ts` — optional draft.month
- `src/features/accounting/ui/StudentPaymentsPage.tsx` — month in create/batch bodies
- Unit tests for request/create schemas + attribution

## Decisions Made

- **apply-month-migration** (checkpoint, user pre-approved 2026-11-05): proceed with expand SQL for both tables; do not defer.
- **No migrate apply from executor:** `DATABASE_URL` points to remote host `138.16.154.52` — migration file committed only; apply with `pnpm db:migrate:deploy` on test/prod (never `migrate reset` / `db push` / seed on shared DB).
- Confirm security (T-17-03): month from DB-loaded request via `paymentMonthFromRequest`, not confirm body.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as written (checkpoint pre-approved; create-only style migration for shared DB).

### Deferred / Out of Scope (per plan)

- Yellow unpaid Tag in parent Select → 17-02
- Debts page / ROLE_ROUTES → 17-03
- Full E2E `tuition-month.spec.ts` → 17-04

## Threat Mitigations

| Threat | Disposition | Evidence |
|--------|-------------|---------|
| T-17-01 Tampering migration | mitigate | Expand-only SQL; human checkpoint apply-month-migration; no reset/push/seed |
| T-17-03 Confirm month override | mitigate | `month: paymentMonthFromRequest(request.month)` in confirm create |
| T-17-04 Parent ownership | mitigate | Existing parentId check unchanged |
| T-17-05 Zod month | mitigate | `monthSchema` on create/batch/request |

## Known Stubs

None that block tracer goal. Parent month Select uses plain options (yellow unpaid deferred to 17-02 by plan).

## Deploy note

```bash
pnpm db:migrate:deploy
pnpm exec prisma migrate status
```

## Self-Check: PASSED

- FOUND: prisma/migrations/20261105190000_tuition_payment_month/migration.sql
- FOUND: src/features/accounting/lib/month-paid-attribution.ts
- FOUND commits: 1ed2598, a93ae06
- Unit tests 11/11 pass; prisma validate OK; tsc --noEmit exit 0
