---
phase: 12
slug: progress-sessions
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-11
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.9 (unit) + Playwright 1.61.0 (E2E deferred to Phase 13) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm test:unit` |
| **Full suite command** | `pnpm test:unit -- src/shared/lib/validations/session.test.ts src/shared/lib/validations/student-progress.test.ts src/shared/lib/student-progress/ src/features/groups/actions/group-actions.test.ts` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** targeted `pnpm test:unit -- <file>` when tests exist; scoped `rg` pattern checks for wave-3 parallel plans (12-03); `pnpm exec tsc --noEmit` only in 12-04-03 and 12-05-03; otherwise `pnpm exec prisma validate`
- **After every plan wave:** `pnpm test:unit` for wave tests; `pnpm exec tsc --noEmit` after wave 3 (12-04-03) and wave 4 (12-05-03)
- **Before `/gsd-verify-work`:** Full phase 12 unit suite + `pnpm exec tsc --noEmit` green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | SUBJ-08, SUBJ-09 | T-12-01 | GroupEnrollment.currentStepIdx + Session.groupId schema | manual | `pnpm exec prisma validate` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | SUBJ-08, SUBJ-09 | T-12-01 | Migration backfill progress + sessions | manual | `pnpm exec prisma validate && node -e "const fs=require('fs');const p='prisma/migrations';if(!fs.readdirSync(p).some(d=>fs.existsSync(p+'/'+d+'/migration.sql')))process.exit(1)"` | ✅ | ⬜ pending |
| 12-01-03 | 01 | 1 | SUBJ-09 | T-12-SC | createSessionSchema groupId + migration apply | unit | `pnpm db:migrate && pnpm exec prisma generate && pnpm test:unit -- src/shared/lib/validations/session.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | SUBJ-08, SUBJ-10 | T-12-03 | recalculateStudentStepIdx per enrollment | unit | `pnpm test:unit -- src/shared/lib/student-progress/recalculate.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | SUBJ-10 | T-12-04 | syncCompletionsForProgress with groupId | unit | `pnpm test:unit -- src/shared/lib/student-progress/sync-for-progress.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-03 | 02 | 2 | SUBJ-08 | — | Barrel exports updated | unit | `pnpm test:unit -- src/shared/lib/student-progress/` | ✅ | ⬜ pending |
| 12-03-01 | 03 | 3 | SUBJ-09 | T-12-05 | POST/GET sessions with groupId | manual | `rg "groupId" src/app/api/sessions/route.ts && rg "recalculateStudentStepIdx\\(studentId, groupId" src/app/api/sessions/route.ts && rg "groupId" src/shared/lib/validations/session.ts` | ✅ | ⬜ pending |
| 12-03-02 | 03 | 3 | SUBJ-10 | T-12-06 | step-completions with groupId recalculate | manual | `rg "recalculateStudentStepIdx\\(studentId, groupId" src/app/api/step-completions/ && ! rg "recalculateStudentStepIdx\\(studentId,\\s*tx\\)" src/app/api/step-completions/ src/app/api/sessions/route.ts` | ✅ | ⬜ pending |
| 12-03-03 | 03 | 3 | SUBJ-09 | — | getStudentLesson enrollment progress | manual | `rg "enrollment\\.currentStepIdx" src/features/journal/actions/journal-actions.ts && rg "groupId.*teacherGroup|teacherGroup\\.id" src/features/journal/actions/journal-actions.ts && ! rg "student\\.currentStepIdx" src/features/journal/actions/journal-actions.ts src/features/journal/lib/get-student-session.ts` | ✅ | ⬜ pending |
| 12-04-01 | 04 | 3 | SUBJ-08 | T-12-07 | student-admin per enrollment | unit | `pnpm test:unit -- src/shared/lib/validations/student-progress.test.ts` | ❌ W0 | ⬜ pending |
| 12-04-02 | 04 | 3 | SUBJ-08 | T-12-08 | students API + enrollStudent | unit | `pnpm test:unit -- src/features/groups/actions/group-actions.test.ts` | ✅ | ⬜ pending |
| 12-04-03 | 04 | 3 | SUBJ-08 | — | Compile sweep without Student.currentStepIdx | manual | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 12-05-01 | 05 | 4 | SUBJ-08, SUBJ-09, SUBJ-10 | T-12-09 | REQUIREMENTS/ROADMAP/PROJECT D-01 alignment | manual | `rg "GroupEnrollment|groupId|зачислен" .planning/REQUIREMENTS.md .planning/ROADMAP.md && rg "SUBJ-08|SUBJ-09|SUBJ-10" .planning/REQUIREMENTS.md && rg "Phase 12" .planning/ROADMAP.md` | ✅ | ⬜ pending |
| 12-05-02 | 05 | 4 | SUBJ-08 | — | seed enrollment progress | manual | `rg "groupEnrollment\\.create" prisma/seed.ts prisma/seed-e2e.ts && rg "currentStepIdx" prisma/seed.ts prisma/seed-e2e.ts | rg "groupEnrollment|GroupEnrollment" && ! rg -n "currentStepIdx" prisma/seed.ts prisma/seed-e2e.ts | rg -i "prisma\\.student\\.(update|create)|student\\.update|student\\.create"` | ✅ | ⬜ pending |
| 12-05-03 | 05 | 4 | SUBJ-08, SUBJ-09, SUBJ-10 | — | Phase 12 final verification | unit | `pnpm test:unit -- src/shared/lib/validations/session.test.ts src/shared/lib/validations/student-progress.test.ts src/shared/lib/student-progress/ src/features/groups/actions/group-actions.test.ts && pnpm exec tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/shared/lib/validations/session.test.ts` — createSessionSchema requires groupId
- [ ] `src/shared/lib/student-progress/recalculate.test.ts` — enrollment-scoped recalculate + auto-promote isolation
- [ ] `src/shared/lib/student-progress/sync-for-progress.test.ts` — adjustment session per groupId
- [ ] `src/shared/lib/validations/student-progress.test.ts` — updateStudentProgressSchema requires groupId

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration on prod | SUBJ-08, SUBJ-09 | No prod in CI | `pnpm db:migrate:deploy` on staging; verify enrollment currentStepIdx backfill + Session.groupId |
| Planning docs alignment | SUBJ-08…10 | Doc grep, not unit test | Confirm REQUIREMENTS/ROADMAP use group/enrollment scope, not subject-only wording |
| Journal UI compile fixes | SUBJ-09 | Phase 13 owns UX | `pnpm exec tsc --noEmit` passes; no picker/layout changes in 12-04 Task 3 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Verify commands fail on compile errors (no `|| echo` masking)

**Approval:** approved 2026-07-11
