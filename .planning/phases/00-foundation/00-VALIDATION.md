---
phase: 0
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-24
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.0 + vitest (unit filters) |
| **Config file** | `playwright.config.ts`, `vitest.config.ts` (Plan 01) |
| **Quick run command** | `pnpm exec playwright test e2e/api-auth.spec.ts -g "401"` |
| **Full suite command** | `pnpm test:e2e` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Task-specific `<automated>` from PLAN.md
- **After every plan wave:** `pnpm test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 00-01-T1 | 01 | 0 | FND-01 | — | RED: filters tests fail | unit | `pnpm test:unit -- filters.test.ts && exit 1 \|\| exit 0` | ❌ W0 | ⬜ pending |
| 00-01-T2 | 01 | 0 | FND-02 | — | api helpers compile | tsc | `pnpm exec tsc --noEmit` | ❌ W0 | ⬜ pending |
| 00-01-T3 | 01 | 0 | FND-02/03/04 | — | specs registered | list | `pnpm exec playwright test e2e/api-auth.spec.ts --list` | ❌ W0 | ⬜ pending |
| 00-02-T1 | 02 | 1 | FND-01 | — | schema valid | prisma | `pnpm exec prisma validate` | ❌ W0 | ⬜ pending |
| 00-02-T2 | 02 | 1 | FND-01 | — | migration applied | migrate | `pnpm exec prisma migrate status` | ❌ W0 | ⬜ pending |
| 00-02-T3 | 02 | 1 | FND-01 | — | filters unit green | unit | `pnpm test:unit -- filters.test.ts` | ❌ W0 | ⬜ pending |
| 00-03-T1 | 03 | 1 | FND-02 | T-0-01 | authorizeApiRequest compiles | tsc | `pnpm exec tsc --noEmit` | ❌ W0 | ⬜ pending |
| 00-03-T2 | 03 | 1 | FND-02 | — | routes lint clean | lint | `pnpm run lint` | ❌ W0 | ⬜ pending |
| 00-03-T3 | 03 | 1 | FND-02 | T-0-02/03 | API auth matrix | e2e | `pnpm exec playwright test e2e/api-auth.spec.ts -g "401\|cross-group\|sessions"` | ❌ W0 | ⬜ pending |
| 00-04-T1 | 04 | 2 | FND-03 | — | student-progress module | tsc | `pnpm exec tsc --noEmit` | ❌ W0 | ⬜ pending |
| 00-04-T2 | 04 | 2 | FND-03 | T-0-07 | call sites wired | build | `pnpm run build` | ❌ W0 | ⬜ pending |
| 00-04-T3 | 04 | 2 | FND-03 | — | journal+portal+analytics | e2e | `pnpm exec playwright test e2e/student-progress.spec.ts` | ❌ W0 | ⬜ pending |
| 00-05-T1 | 05 | 3 | FND-04 | — | AuditEvent schema | prisma | `pnpm exec prisma validate` | ❌ W0 | ⬜ pending |
| 00-05-T2 | 05 | 3 | FND-04 | — | migration applied | migrate | `pnpm exec prisma migrate status` | ❌ W0 | ⬜ pending |
| 00-05-T3 | 05 | 3 | FND-04 | — | audit row on mutation | e2e | `pnpm exec playwright test e2e/domain-events.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Plan 01: vitest + e2e/helpers/api.ts + stub specs (api-auth, student-progress, domain-events)
- [ ] Prisma migrations in Plans 02 and 05 with [BLOCKING] push tasks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Analytics dashboard visual | FND-01 | UI month filter | Manager login → `/analytics` → compare with filtered API |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
