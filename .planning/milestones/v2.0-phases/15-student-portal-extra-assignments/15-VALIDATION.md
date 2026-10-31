---
phase: 15
slug: student-portal-extra-assignments
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-12
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright 1.61.0 (E2E wave gate) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm exec vitest run src/features/student-portal/lib/student-portal-query.test.ts` |
| **Full suite command** | `pnpm exec vitest run src/features/student-portal/lib/student-portal-query.test.ts src/features/student-portal/actions/student-actions.test.ts src/app/api/extra-assignments/history/route.test.ts && pnpm exec tsc --noEmit && pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts --reporter=line` |
| **Estimated runtime** | ~100 seconds (unit ~20s, E2E ~80s) |

---

## Sampling Rate

- **After every task commit:** targeted vitest when tests exist; scoped `rg` for UI/wiring; `pnpm exec tsc --noEmit` for compile-only tasks
- **After every plan wave:** wave unit tests green; `pnpm exec tsc --noEmit`
- **Before `/gsd-verify-work`:** full phase 15 unit suite + Playwright E2E + tsc green
- **Max feedback latency:** 100 seconds (E2E only in 15-04-03 wave gate)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | SUBJ-16 | T-15-01 | resolveStudentGroupId + buildStudentPortalSearchParams | unit | `pnpm exec vitest run src/features/student-portal/lib/student-portal-query.test.ts` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | SUBJ-16 | T-15-02 | getStudentEnrollmentDashboard per enrollment + subject-scoped totals | unit | `pnpm exec vitest run src/features/student-portal/actions/student-actions.test.ts` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | SUBJ-16 | T-15-03 | StudentEnrollmentCard + me page cards per D-01–D-04 | manual | `pnpm exec tsc --noEmit && rg "StudentEnrollmentCard|getStudentEnrollmentDashboard" src/app/(dashboard)/student/me/page.tsx src/features/student-portal/` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 2 | SUBJ-16 | T-15-04 | resolveStudentGroupId primary fallback (D-08) | unit | `pnpm exec vitest run src/features/student-portal/lib/student-portal-query.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | SUBJ-16 | T-15-05 | getStudentLessons/getStudentSessionHistory scoped by groupId | unit | `pnpm exec vitest run src/features/student-portal/actions/student-actions.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-03 | 02 | 2 | SUBJ-16 | T-15-06 | Deep links + AppShell nav preserved (D-05, D-06) | manual | `pnpm exec tsc --noEmit && rg "/student/lessons" "src/widgets/app-shell/ui/AppShell.tsx" && rg "/student/history" "src/widgets/app-shell/ui/AppShell.tsx"` | ✅ | ⬜ pending |
| 15-03-01 | 03 | 1 | SUBJ-17 | T-15-07 | getProgramStepsForExtraAssignments filters by subjectId | unit | `pnpm exec vitest run src/features/extra-assignments/actions/extra-assignment-actions.test.ts` | ❌ W0 | ⬜ pending |
| 15-03-02 | 03 | 1 | SUBJ-17 | T-15-08 | Catalog API + subjectId query param | unit | `pnpm exec vitest run src/app/api/extra-assignments/route.test.ts` | ❌ W0 | ⬜ pending |
| 15-03-03 | 03 | 1 | SUBJ-17 | T-15-09 | Assign modal filters templates by group subject | manual | `pnpm exec tsc --noEmit && rg "subjectId" src/features/extra-assignments/ui/AssignExtraAssignmentModal.tsx` | ✅ | ⬜ pending |
| 15-04-01 | 04 | 3 | SUBJ-17 | T-15-10 | STUDENT history API — own studentId only | unit | `pnpm exec vitest run src/app/api/extra-assignments/history/route.test.ts` | ❌ W0 | ⬜ pending |
| 15-04-02 | 04 | 3 | SUBJ-16, SUBJ-17 | T-15-11 | StudentExtraAssignmentsHistory grouped by subject | manual | `pnpm exec tsc --noEmit && rg "subject" src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx` | ✅ | ⬜ pending |
| 15-04-03 | 04 | 3 | SUBJ-16, SUBJ-17 | — | Unit/API green, then E2E portal + catalog subject filter | unit+e2e | `pnpm exec vitest run src/features/student-portal/lib/student-portal-query.test.ts src/features/student-portal/actions/student-actions.test.ts src/app/api/extra-assignments/history/route.test.ts && pnpm exec tsc --noEmit && pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts --reporter=line` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/student-portal/lib/student-portal-query.test.ts` — resolveStudentGroupId, buildStudentPortalSearchParams (created in 15-01-01 TDD task)
- [ ] `src/features/student-portal/actions/student-actions.test.ts` — getStudentEnrollmentDashboard, scoped lessons/history (created in 15-01-02 / 15-02-02 TDD tasks)
- [ ] `src/features/extra-assignments/actions/extra-assignment-actions.test.ts` — getProgramStepsForExtraAssignments subject filter (created in 15-03-01 TDD task)
- [ ] `src/app/api/extra-assignments/route.test.ts` — list with subjectId filter (created in 15-03-02 TDD task)
- [ ] `src/app/api/extra-assignments/history/route.test.ts` — STUDENT auth, subjectId filter, forbid foreign studentId (created in 15-04-01 TDD task before implementation)

*Seed-e2e: ensure `prisma/seed-e2e.ts` includes StudentExtraAssignment rows for at least two subjects so E2E can assert subject sections (not only Empty state).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard cards per enrollment | SUBJ-16, D-02 | Multi-enrollment seed visibility | Login as student with 2 enrollments → 2 cards with distinct group names |
| Metrics per card | SUBJ-16, D-04 | DB + month scope | Each card shows StudentMetricsCards variant portal |
| Primary enrollment from menu | SUBJ-16, D-08 | URL default chain | Open /student/lessons from nav without groupId → primary group subtitle |
| Catalog subject Select | SUBJ-17 | UI + seed | Teacher opens /extra-assignments → subject Select visible; steps change on subject switch |
| Student history grouping | SUBJ-17, ROADMAP п.3 | Visual sections | /student/extra-assignments → Collapse/sections per subject.name |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive compile-only tasks without unit test in map
- [x] Wave 0 covers history API, dashboard action, subject filter API tests
- [x] No watch-mode flags
- [x] Feedback latency < 100s (E2E only on 15-04-03 wave gate)
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Verify commands fail on compile errors (no `|| echo` masking)

**Approval:** pending
