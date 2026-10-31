---
phase: 11
slug: groups-enrollment
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-07
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.9 (unit) + Playwright 1.61.0 (E2E) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm test:unit` |
| **Full suite command** | `pnpm test:e2e e2e/groups-enrollment.spec.ts` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** `pnpm test:unit` (targeted when tests exist)
- **After every plan wave:** `pnpm test:unit` + `pnpm test:e2e e2e/groups-enrollment.spec.ts`
- **Before `/gsd-verify-work`:** Full unit + groups E2E green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SUBJ-05 | — | Group.subjectId + GroupEnrollment schema | manual | `pnpm exec prisma validate` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | SUBJ-06 | — | Migration backfill enrollments | manual | `pnpm db:migrate` | ✅ | ⬜ pending |
| 11-01-03 | 01 | 1 | SUBJ-05 | T-11-01 | enrollment Zod + level∈subject | unit | `pnpm test:unit -- enrollment.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 2 | SUBJ-07 | T-11-04 | createGroup requires subjectId | unit | `pnpm test:unit -- group-actions.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 2 | SUBJ-07 | — | subject column + filter in GroupsList | e2e | `pnpm test:e2e e2e/groups-enrollment.spec.ts` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | SUBJ-06 | T-11-02 | enrollStudent with level guard | unit | `pnpm test:unit -- group-actions.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | SUBJ-06 | — | EnrollStudentModal picker | e2e | `pnpm test:e2e e2e/groups-enrollment.spec.ts` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 3 | SUBJ-06 | T-11-03 | journal API uses enrollments | unit | `pnpm test:unit -- api-auth` | ❌ W0 | ⬜ pending |
| 11-04-02 | 04 | 3 | SUBJ-06 | — | user-admin create student flow | e2e | `pnpm test:e2e` | ❌ W0 | ⬜ pending |
| 11-05-01 | 05 | 3 | SUBJ-18 | — | seed-e2e GroupEnrollment | manual | `pnpm db:seed:e2e` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/groups-enrollment.spec.ts` — SUBJ-05..07 happy paths
- [ ] `src/shared/lib/validations/enrollment.test.ts` — level belongs to group subject
- [ ] `src/features/groups/actions/group-actions.test.ts` — create/enroll/unenroll guards
- [ ] Update `prisma/seed-e2e.ts` — GroupEnrollment instead of Student.groupId

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration on prod | SUBJ-05 | No prod in CI | `pnpm db:migrate:deploy` on staging; verify enrollment count |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-07
