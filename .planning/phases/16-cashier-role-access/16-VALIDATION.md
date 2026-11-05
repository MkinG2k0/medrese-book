---
phase: 16
slug: cashier-role-access
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-11-05
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution (Nyquist).
> Sourced from `16-RESEARCH.md` Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.9 + Playwright ^1.61.0 |
| **Config file** | `vitest.config.ts`; Playwright via `pnpm test:e2e` |
| **Quick run command** | `pnpm test:unit src/shared/lib/match-role-route.test.ts` |
| **Full suite command** | `pnpm test:unit && pnpm test:e2e e2e/cashier-role.spec.ts` |
| **Estimated runtime** | ~90 seconds (unit ~15s, E2E ~75s) |

---

## Sampling Rate

- **After every task commit:** targeted vitest when tests exist; `pnpm exec tsc --noEmit -p tsconfig.json` for compile-only tasks (must fail on errors — no `|| echo` masking)
- **After every plan wave:** wave unit tests green; full `pnpm test:unit` preferred on wave merge
- **Before `/gsd-verify-work`:** full unit green + `pnpm test:e2e e2e/cashier-role.spec.ts`
- **Max feedback latency:** ~90 seconds (E2E only as wave/phase gate)

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CASH-01 | Role exists; cashier login + cash screens | e2e | `pnpm test:e2e e2e/cashier-role.spec.ts` | ❌ Wave 0 |
| CASH-02 | Deny non-cash routes/methods | unit + e2e | match-role-route + assert-cashier-cash-method + e2e deny nav | ⚠️ partial |
| CASH-03 | Accountant still full access | unit + e2e | match-role-route ACCOUNTANT + e2e accountant path | ⚠️ extend |
| TEST-01 | Role coverage | unit + e2e | above | ❌ Wave 0 gaps |
| TEST-04 | No accountant regression | e2e smoke | cashier-role.spec accountant case | ❌ Wave 0 |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | CASH-01 | T-16-03 | Human confirms ADD VALUE CASHIER | checkpoint | — | — | ⬜ pending |
| 16-01-02 | 01 | 1 | CASH-01, CASH-03 | T-16-01 | ROLE_ROUTES dual prefixes + redirect + RSC + menu | unit | `pnpm exec prisma validate && pnpm test:unit src/shared/lib/match-role-route.test.ts` | ⚠️ extend | ⬜ pending |
| 16-02-01 | 02 | 2 | CASH-02, CASH-03 | T-16-04, T-16-05 | assertCashierCashMethod + canReverse for CASHIER | unit | `pnpm test:unit src/features/accounting/lib/assert-cashier-cash-method.test.ts` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 2 | CASH-01, CASH-02 | T-16-04 | confirm/reject dual-role + CASH confirm | compile | `pnpm exec tsc --noEmit -p tsconfig.json` | ✅ | ⬜ pending |
| 16-02-03 | 02 | 2 | CASH-02 | T-16-05, T-16-06 | UI method lock + hide export | compile | `pnpm exec tsc --noEmit -p tsconfig.json` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 3 | CASH-01, D-08 | T-16-02 | Seed 400002 + user-admin CASHIER + badge | compile | `pnpm exec tsc --noEmit -p tsconfig.json` | ✅ | ⬜ pending |
| 16-03-02 | 03 | 3 | CASH-02, CASH-03, TEST-01 | T-16-01 | Full match-role-route CASHIER matrix | unit | `pnpm test:unit src/shared/lib/match-role-route.test.ts` | ⚠️ extend | ⬜ pending |
| 16-03-03 | 03 | 3 | TEST-01, TEST-04 | T-16-08 | E2E cashier vs accountant | e2e | `pnpm test:e2e e2e/cashier-role.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/accounting/lib/assert-cashier-cash-method.test.ts` — CASHIER method guard + canReverse forcing (created in 16-02-01 TDD)
- [ ] Extend `src/shared/lib/match-role-route.test.ts` — CASHIER allow/deny + ACCOUNTANT regression (16-01 tracer smoke + 16-03 full matrix)
- [ ] `e2e/cashier-role.spec.ts` — CASH-01/02/03 + TEST-01/04
- [ ] Seed `400002` + `TEST_CODES.cashier` — prerequisite for E2E (16-03-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User-admin role select shows Кассир | CASH-01, D-08 | Manager UI visual | Login manager → Create user → role option «Кассир» |
| Cashier pending badge on payment-requests | CASH-01 | Layout count | Login cashier with pending requests → badge visible |
| Reverse button absent for cashier | CASH-02, D-06 | History drawer UX | Cashier → payments → history → no «Сторнировать» |

---

## Validation Sign-Off

- [x] All auto tasks have `<automated>` verify that fails on error (no `|| echo` masking)
- [x] TDD tasks point verify at Vitest behavior files
- [x] Wave 0 covers route matrix, cash-method helper, E2E, seed code
- [x] No watch-mode flags
- [x] Feedback latency < 100s (E2E as phase/wave gate)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
