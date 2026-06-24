---
phase: 0
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-24
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.0 (+ optional vitest for unit filters) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `pnpm exec playwright test e2e/api-auth.spec.ts` |
| **Full suite command** | `pnpm test:e2e` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec playwright test e2e/api-auth.spec.ts` (after FND-02 tasks)
- **After every plan wave:** Run `pnpm test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 00-01-01 | 01 | 1 | FND-01 | — | N/A | migration | `pnpm db:migrate` | ❌ W0 | ⬜ pending |
| 00-01-02 | 01 | 1 | FND-01 | — | filters exclude adjustment/prior | unit | `pnpm exec vitest run src/shared/lib/analytics-queries/filters.test.ts` | ❌ W0 | ⬜ pending |
| 00-02-01 | 02 | 1 | FND-02 | T-0-01 | unauthenticated → 401 | e2e | `pnpm exec playwright test e2e/api-auth.spec.ts -g "401"` | ❌ W0 | ⬜ pending |
| 00-02-02 | 02 | 1 | FND-02 | T-0-02 | STUDENT cross-group forbidden | e2e | `pnpm exec playwright test e2e/api-auth.spec.ts -g "cross-group"` | ❌ W0 | ⬜ pending |
| 00-02-03 | 02 | 1 | FND-02 | T-0-03 | sessions without date scoped | e2e | `pnpm exec playwright test e2e/api-auth.spec.ts -g "sessions"` | ❌ W0 | ⬜ pending |
| 00-03-01 | 03 | 2 | FND-03 | — | progress consistent journal/portal | e2e | `pnpm exec playwright test e2e/student-progress.spec.ts` | ❌ W0 | ⬜ pending |
| 00-04-01 | 04 | 2 | FND-04 | — | mutation creates AuditEvent | e2e | `pnpm exec playwright test e2e/domain-events.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/api-auth.spec.ts` — FND-02 matrix
- [ ] `e2e/helpers/api.ts` — `apiGetAs(code, path)`, `expectForbidden`
- [ ] `src/shared/lib/analytics-queries/filters.test.ts` — FND-01 (vitest or tsx script)
- [ ] `e2e/domain-events.spec.ts` — FND-04 audit row assertion
- [ ] `e2e/student-progress.spec.ts` — FND-03 manager edit → journal + portal
- [ ] Prisma migration + backfill for `isAdjustment` / `isPriorCredit`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Analytics dashboard excludes adjustment sessions visually | FND-01 | UI data depends on seeded month | Login as manager, open `/analytics`, verify counts match filtered query |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
