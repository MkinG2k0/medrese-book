---
phase: 14
slug: analytics
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-12
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright 1.61.0 (E2E in 14-03-03) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm test:unit -- src/features/analytics/lib/analytics-query.test.ts` |
| **Full suite command** | `pnpm test:unit -- src/features/analytics/lib/analytics-query.test.ts src/shared/lib/analytics-queries/top-students.test.ts src/shared/lib/analytics-queries/level-stats.test.ts src/shared/lib/analytics-queries/at-risk-students.test.ts src/shared/lib/student-metrics/load-student-metrics.test.ts src/app/api/at-risk-students/route.test.ts src/app/api/step-completions/route.test.ts && pnpm exec tsc --noEmit && pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts` |
| **Estimated runtime** | ~120 seconds (unit ~25s, E2E ~90s) |

---

## Sampling Rate

- **After every task commit:** targeted `pnpm test:unit -- <file>` when tests exist; scoped `rg` pattern checks for UI/wiring tasks; `pnpm exec tsc --noEmit` for compile-only tasks (14-01-02, 14-01-03, 14-03-02)
- **After every plan wave:** wave unit tests green; `pnpm exec tsc --noEmit` after waves 2–3
- **Before `/gsd-verify-work`:** full phase 14 unit suite + `pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts` + `pnpm exec tsc --noEmit` green
- **Max feedback latency:** 120 seconds (E2E wave gate only in 14-03-03)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | SUBJ-14 | T-14-01 | resolveAnalyticsSubjectFilter + buildAnalyticsSearchParams with subjectId | unit | `pnpm test:unit -- src/features/analytics/lib/analytics-query.test.ts` | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | SUBJ-14 | T-14-02 | getAnalyticsSubjects role-scoped; picker resets groupId on subject change | manual | `pnpm exec tsc --noEmit && rg "getAnalyticsSubjects|AnalyticsSubjectPicker" src/features/analytics/` | ✅ | ⬜ pending |
| 14-01-03 | 01 | 1 | SUBJ-14 | T-14-03 | page.tsx subject pickers wired; no mixed-subject metric queries (D-05 placeholder gate) | manual | `pnpm exec tsc --noEmit && rg "getTopStudents|getLevelStats|getAtRiskStudents" "src/app/(dashboard)/analytics/page.tsx"; test $? -ne 0` | ✅ | ⬜ pending |
| 14-02-01 | 02 | 2 | SUBJ-15 | T-14-04 | getTopStudents/getLevelStats require subjectId; Prisma where includes group.subjectId | unit | `pnpm test:unit -- src/shared/lib/analytics-queries/top-students.test.ts src/shared/lib/analytics-queries/level-stats.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 2 | SUBJ-15 | T-14-05 | getAtRiskStudents + loadStudentMetricsForMonth subject scope; worst-case enrollment | unit | `pnpm test:unit -- src/shared/lib/analytics-queries/at-risk-students.test.ts src/shared/lib/student-metrics/load-student-metrics.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-03 | 02 | 2 | SUBJ-15 | T-14-06 | page + at-risk API/hook require subjectId everywhere; metrics blocks restored | unit+manual | `pnpm test:unit -- src/app/api/at-risk-students/route.test.ts && pnpm exec tsc --noEmit && rg "subjectId" src/app/api/at-risk-students/route.ts src/entities/student-metrics/api/use-student-metrics.ts` | ✅ | ⬜ pending |
| 14-03-01 | 03 | 3 | SUBJ-15 | T-14-07 | GET step-completions filters by session.group.subjectId when subjectId set | unit | `pnpm test:unit -- src/app/api/step-completions/route.test.ts` | ❌ W0 | ⬜ pending |
| 14-03-02 | 03 | 3 | SUBJ-14, SUBJ-15 | T-14-08 | StudentStudyHistoryModal passes subjectId to useStepCompletions; UI unchanged (D-08) | manual | `pnpm exec tsc --noEmit && rg "subjectId" src/features/analytics/ui/StudentStudyHistoryModal.tsx src/features/analytics/ui/TopStudents.tsx` | ✅ | ⬜ pending |
| 14-03-03 | 03 | 3 | SUBJ-14, SUBJ-15 | — | Unit/API regression green, then E2E subject picker + history scope + group reset (D-09) | unit+e2e | `pnpm test:unit -- src/features/analytics/lib/analytics-query.test.ts src/shared/lib/analytics-queries/top-students.test.ts src/shared/lib/analytics-queries/level-stats.test.ts src/shared/lib/analytics-queries/at-risk-students.test.ts src/shared/lib/student-metrics/load-student-metrics.test.ts src/app/api/step-completions/route.test.ts && pnpm exec tsc --noEmit && pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts --reporter=line` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/shared/lib/analytics-queries/top-students.test.ts` — subjectId in Prisma where (created in 14-02-01 TDD task)
- [ ] `src/shared/lib/analytics-queries/level-stats.test.ts` — levels filtered by subjectId; label without subject suffix (created in 14-02-01 TDD task)
- [ ] `src/shared/lib/analytics-queries/at-risk-students.test.ts` — enrollments/sessions scoped to subjectId (created in 14-02-02 TDD task before implementation)
- [ ] `src/shared/lib/student-metrics/load-student-metrics.test.ts` — worst-case enrollment selection in subject scope (created in 14-02-02 TDD task)
- [ ] `src/app/api/step-completions/route.test.ts` — GET with subjectId filters group.subjectId (created in 14-03-01 TDD task)

*Existing `src/features/analytics/lib/analytics-query.test.ts` covers 14-01-01; existing `src/app/api/at-risk-students/route.test.ts` updated in 14-02-03.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Subject picker role-scoped list | SUBJ-14 | Role + DB seed visibility | Login as teacher → only subjects from own groups; login as manager → all subjects |
| Placeholder gate wave 1 | SUBJ-14, D-05 | UX between waves | After 14-01: /analytics shows pickers + Empty placeholder, no top/level/at-risk data blocks |
| History modal UI unchanged | SUBJ-15, D-08 | Visual regression discretion | Open history from top student; confirm Modal/Tabs/columns layout identical; only row count differs by subject |
| Subject change resets group | SUBJ-14, D-09 | URL + picker chain | Select group A for subject Quran; switch subject to Tajweed; URL groupId resets to ALL_GROUPS |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (top/level/at-risk/load-student-metrics/step-completions tests)
- [x] No watch-mode flags
- [x] Feedback latency < 120s (E2E only on 14-03-03 wave gate)
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Verify commands fail on compile errors (no `|| echo` masking)

**Approval:** pending
