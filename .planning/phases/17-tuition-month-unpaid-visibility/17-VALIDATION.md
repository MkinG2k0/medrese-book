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
> Sourced from `17-RESEARCH.md` Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.9 + Playwright ^1.61.0 |
| **Config file** | `vitest.config.ts`; Playwright via `pnpm test:e2e` |
| **Quick run command** | `pnpm test:unit src/shared/lib/validations/tuition-payment-request.test.ts src/features/parent-portal/lib/unpaid-months.test.ts src/shared/lib/match-role-route.test.ts` |
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
| TUITION-02 | Unpaid months marked yellow in select | unit + e2e | unpaid helper + E2E Tag | ❌ Wave 0 |
| TUITION-03 | Accountant debts page shows month debt | e2e | `e2e/tuition-month.spec.ts` | ❌ Wave 0 |
| TUITION-04 | Cashier debts + request month | e2e + unit routes | E2E + match-role-route | ❌ Wave 0 |
| D-02 | monthPaid uses `payment.month` not date | unit | attribution test | ❌ Wave 0 |
| D-10 | POST payment without month rejected | unit | Zod safeParse | ❌ Wave 0 |
| TEST-01 | Coverage for tuition month REQs | unit + e2e | above | ❌ Wave 0 |
| TEST-04 | Cashier matrix + create/confirm with month | e2e regression | cashier-role + tuition-month | ⚠️ extend |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-* | 01 | 1 | TUITION-01, D-01..03 | T-17-01 | Migration + Zod month; monthPaid by payment.month | unit | schema + attribution tests | ❌ W0 | ⬜ pending |
| 17-02-* | 02 | 2 | TUITION-02, D-04..06 | — | Parent select + yellow unpaid | unit + e2e | unpaid-months + e2e | ❌ W0 | ⬜ pending |
| 17-03-* | 03 | 3 | TUITION-03/04, D-07..10 | T-17-02 | Debts page dual-role + create month | unit + e2e | routes + tuition-month e2e | ❌ W0 | ⬜ pending |
| 17-04-* | 04 | 4 | TEST-01, TEST-04 | — | Full E2E + cashier regression | e2e | tuition-month + cashier-role | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*  
*Planner refines task IDs when PLAN.md files are written.*

---

## Wave 0 Requirements

- [ ] `src/features/parent-portal/lib/unpaid-months.ts` + `.test.ts` — unpaid detection + month range (TUITION-02, D-05/D-06)
- [ ] Extend `tuition-payment-request.test.ts` — `month` required / invalid format
- [ ] Extend `match-role-route.test.ts` — `/accounting/debts` CASHIER+ACCOUNTANT allow; TEACHER deny
- [ ] Unit for monthPaid attribution (`payment.month` vs date)
- [ ] `e2e/tuition-month.spec.ts` — parent yellow; debts page both roles; create/confirm with month
- [ ] Update existing schema tests that omit `month` (TEST-04)

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

**Approval:** pending
