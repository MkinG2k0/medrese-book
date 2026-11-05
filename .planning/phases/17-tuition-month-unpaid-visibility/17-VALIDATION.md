---
phase: 17
slug: tuition-month-unpaid-visibility
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-11-05
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution (Nyquist).
> Sourced from `17-RESEARCH.md` Validation Architecture; task IDs aligned to PLAN.md.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.9 + Playwright ^1.61.0 |
| **Config file** | `vitest.config.ts`; Playwright via `pnpm test:e2e` |
| **Quick run command** | `pnpm test:unit src/shared/lib/validations/tuition-payment-request.test.ts src/shared/lib/validations/tuition-payment-create.test.ts src/features/accounting/lib/month-paid-attribution.test.ts src/features/parent-portal/lib/unpaid-months.test.ts src/shared/lib/match-role-route.test.ts src/features/accounting/lib/query-tuition-debts.test.ts` |
| **Full suite command** | `pnpm test:unit && pnpm test:e2e e2e/tuition-month.spec.ts e2e/cashier-role.spec.ts` |
| **Estimated runtime** | ~120 seconds (unit ~20s, E2E ~100s) |

---

## Sampling Rate

- **After every task commit:** targeted Vitest / `pnpm exec tsc --noEmit -p tsconfig.json` (must fail on errors — no `|| echo` masking)
- **After every plan wave:** wave unit tests green; full `pnpm test:unit` preferred on wave merge
- **Before `/gsd-verify-work`:** full unit green + `e2e/tuition-month.spec.ts` + `e2e/cashier-role.spec.ts`
- **Max feedback latency:** ~120 seconds (E2E as wave/phase gate)

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUITION-01 | Request schema requires `month`; create persists one month | unit + e2e | Vitest schema; E2E parent submit | ⚠️ extend |
| TUITION-02 | Unpaid months marked yellow in select | unit + e2e | unpaid helper + E2E Tag | ❌ Wave 0 / 17-02 |
| TUITION-03 | Accountant debts page shows month debt | e2e | `e2e/tuition-month.spec.ts` | ❌ 17-04 |
| TUITION-04 | Cashier debts + request month | e2e + unit routes | E2E + match-role-route | ❌ 17-03/04 |
| D-02 | monthPaid uses `payment.month` not date | unit | attribution test | ❌ 17-01 |
| D-10 | POST payment without month rejected | unit | Zod safeParse | ❌ 17-01 |
| TEST-01 | Coverage for tuition month REQs | unit + e2e | above | ❌ plans 01–04 |
| TEST-04 | Cashier matrix + create/confirm with month | e2e regression | cashier-role + tuition-month | ⚠️ extend |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-checkpoint | 01 | 1 | D-01..03 | T-17-01 | Human approve expand+backfill migration | checkpoint | — | — | ⬜ pending |
| 17-01-W0-units | 01 | 1 | TUITION-01, D-02, D-10, TEST-01 | — | RED tests: month required + attribution | unit | tuition-payment-*.test + month-paid-attribution.test | ❌ | ⬜ pending |
| 17-01-tracer | 01 | 1 | TUITION-01, D-01..03, D-10, TEST-04 | T-17-03, T-17-04 | Migration+Zod+confirm copies DB month; monthPaid by payment.month; parent/cash write month | unit + tsc | schema + attribution + prisma validate + tsc | ❌ | ⬜ pending |
| 17-02-unpaid-lib | 02 | 2 | TUITION-02, D-05/D-06 | — | isMonthUnpaid + OR multi-child + range | unit | unpaid-months.test.ts | ❌ | ⬜ pending |
| 17-02-parent-select | 02 | 2 | TUITION-02, D-04 | T-17-04 | Select optionRender Tag gold; draft month | unit + tsc | unpaid-months + tsc | ❌ | ⬜ pending |
| 17-03-role-routes | 03 | 2 | TUITION-04, TEST-04 | T-17-02 | `/accounting/debts` ACCOUNTANT+CASHIER; TEACHER deny | unit | match-role-route.test.ts | ⚠️ extend | ⬜ pending |
| 17-03-debts-page | 03 | 2 | TUITION-03, TUITION-04, D-07/D-08 | T-17-02, T-17-07 | Debts RSC + query by payment.month + menu «Долги» | unit + tsc | query-tuition-debts.test + tsc | ❌ | ⬜ pending |
| 17-03-requests-month | 03 | 2 | TUITION-04, D-09 | T-17-03 | payment-requests list shows request.month | tsc | tsc --noEmit | ⚠️ | ⬜ pending |
| 17-04-e2e | 04 | 3 | TEST-01, TEST-04, TUITION-01..04 | T-17-02 | Parent yellow + debts both roles + create/confirm month; cashier-role green | e2e + unit | tuition-month + cashier-role + test:unit | ❌ | ⬜ pending |
| 17-04-uat | 04 | 3 | TUITION-02..04 | — | Visual gold Tag + debts readability | human | checklist in PLAN | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/parent-portal/lib/unpaid-months.ts` + `.test.ts` — unpaid detection + month range (TUITION-02, D-05/D-06) — **17-02**
- [ ] Extend `tuition-payment-request.test.ts` — `month` required / invalid format — **17-01**
- [ ] New `tuition-payment-create.test.ts` — create/batch require month — **17-01**
- [ ] Extend `match-role-route.test.ts` — `/accounting/debts` CASHIER+ACCOUNTANT allow; TEACHER deny — **17-03**
- [ ] Unit for monthPaid attribution (`payment.month` vs date) — **17-01** `month-paid-attribution.test.ts`
- [ ] `e2e/tuition-month.spec.ts` — parent yellow; debts page both roles; create/confirm with month — **17-04**
- [ ] Update existing schema tests that omit `month` (TEST-04) — **17-01**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Yellow Tag contrast in dark theme | TUITION-02 | Visual | Parent → pay → open month select → unpaid gold Tag readable |
| Debts table readability | TUITION-03/04 | Layout density | Accountant + cashier open `/accounting/debts` |

---

## Validation Sign-Off

- [x] All phase REQs mapped to automated tests (Wave 0 gaps listed)
- [x] Sampling continuity expected via per-task targeted unit
- [x] Wave 0 covers unpaid helper, schema, routes, attribution, E2E
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Per-Task Verification Map uses real plan task IDs (17-01…17-04)

**Approval:** pending
