---
phase: 01
slug: student-analytics-history
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-01
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Covers student-metrics module, at-risk API, teaching-session timer, and E2E flows per CONTEXT D-01…D-09 and ANLY-01…ANLY-10.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | Vitest 4.x (`vitest.config.ts`) |
| **E2E framework** | Playwright 1.61 (`playwright.config.ts`) |
| **Config files** | `vitest.config.ts`, `playwright.config.ts`, `e2e/global-setup.ts` |
| **Quick run command** | `pnpm test:unit -- src/shared/lib/student-metrics` |
| **Full unit suite** | `pnpm test:unit` |
| **E2E suite (phase)** | `pnpm test:e2e -- e2e/student-analytics.spec.ts` |
| **Full E2E suite** | `pnpm test:e2e` |
| **Type check** | `pnpm exec tsc --noEmit` |
| **Estimated runtime** | ~15s unit (student-metrics), ~60s E2E spec |

---

## Test Dimensions

| Dimension | Scope | Tool | Phase artifacts |
|-----------|-------|------|-----------------|
| **Unit** | Pure functions: period-metrics, time-norm, attendance-risk, risk-flags, teaching-session serialize | Vitest | `src/shared/lib/student-metrics/*.test.ts`, `src/features/journal/lib/teaching-session.test.ts` |
| **Integration** | API routes auth + data mapping; load-student-metrics with mocked Prisma | Vitest route tests | `src/app/api/at-risk-students/route.test.ts`, `src/shared/lib/analytics-queries/filters.test.ts` |
| **E2E** | Teacher timer, journal unlock, at-risk table → history modal, portal metrics, history duration column | Playwright | `e2e/student-analytics.spec.ts` |

---

## Sampling Rate

- **After every task commit:** Run task `<automated>` verify from PLAN.md
- **After wave 1 (01-01):** `pnpm test:unit -- src/shared/lib/student-metrics`
- **After wave 2 (01-02):** `pnpm test:unit -- src/shared/lib/student-metrics src/shared/lib/analytics-queries/filters.test.ts && pnpm exec tsc --noEmit`
- **After wave 3 (01-03):** `pnpm test:unit -- src/shared/lib/student-metrics src/features/journal/lib/teaching-session && pnpm exec tsc --noEmit`
- **After wave 4 (01-04):** `pnpm exec tsc --noEmit`
- **After wave 5 (01-05):** `pnpm test:e2e -- e2e/student-analytics.spec.ts` + full unit regression
- **Before `/gsd-verify-work`:** `pnpm test:unit && pnpm test:e2e -- e2e/student-analytics.spec.ts`
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | ANLY-07, D-05 | T-01-01 | AT_RISK_CONFIG typed; no scattered magic numbers | unit | `pnpm test:unit -- src/shared/lib/student-metrics/time-norm.test.ts` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | ANLY-03, ANLY-04, ANLY-10 | T-01-01 | prior credit + adjustment excluded from counts | unit | `pnpm test:unit -- src/shared/lib/student-metrics/period-metrics.test.ts` | ✅ | ⬜ pending |
| 01-01-03 | 01 | 1 | ANLY-05, ANLY-06, ANLY-07, D-01…D-06, D-09 | T-01-01 | time norm + attendance risk + riskFlags composition | unit | `pnpm test:unit -- src/shared/lib/student-metrics` | ✅ | ⬜ pending |
| 01-02-01 | 02 | 2 | ANLY-05, ANLY-07, ANLY-08 | T-01-04 | getAtRiskStudents returns only flagged students | unit | `pnpm test:unit -- src/shared/lib/student-metrics && pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-02-02 | 02 | 2 | ANLY-03…05, D-07 | T-01-04, T-01-05 | STUDENT forbidden on at-risk; student-metrics scoped | integration | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-02-03 | 02 | 2 | ANLY-09 | T-01-06 | step-completions include sessionDurationMinutes | integration | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-03-01 | 03 | 3 | ANLY-01, ANLY-02, D-04 | T-01-08 | TeachingSession start/end persisted; actualTimeSource → teaching_session | unit | `pnpm test:unit -- src/features/journal/lib/teaching-session.test.ts src/shared/lib/student-metrics/period-metrics.test.ts` | ✅ | ⬜ pending |
| 01-03-02 | 03 | 3 | ANLY-07, D-08 | T-01-07 | Badge only TEACHER/MANAGER; no STUDENT exposure | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-03-03 | 03 | 3 | ANLY-03…07, D-07 | T-01-07 | NormWarningAlert via getStudentLesson; no at-risk on /student/* | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-04-01 | 04 | 4 | ANLY-07, ANLY-08, D-08 | T-01-09 | AtRiskStudentsTable SSR; row opens history modal | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-04-02 | 04 | 4 | ANLY-03…06, D-07 | T-01-10 | Portal metrics without at-risk copy | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-04-03 | 04 | 4 | ANLY-08, ANLY-09 | — | History columns include duration | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 01-05-01 | 05 | 5 | ANLY-01…09 | T-01-11 | E2E timer, at-risk, portal, history duration column | E2E | `pnpm test:e2e -- e2e/student-analytics.spec.ts` | ❌ W0 | ⬜ pending |
| 01-05-02 | 05 | 5 | ANLY-08, D-07 | T-01-12 | STUDENT → 403 on /api/at-risk-students | integration | `pnpm test:unit -- src/app/api/at-risk-students/route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — existing; covers `src/**/*.test.ts`
- [x] `playwright.config.ts` + `e2e/global-setup.ts` — existing seed
- [ ] `e2e/student-analytics.spec.ts` — created in plan 01-05 Task 1
- [ ] `src/app/api/at-risk-students/route.test.ts` — created in plan 01-05 Task 2

*Wave 0 scaffold items are deliverables of plan 01-05; no new framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AtRiskStudentsTable visual layout | ANLY-08 | Ant Design Table spacing not asserted in E2E | Open `/analytics` as manager; confirm block order AtRisk → TopStudents → LevelStats |
| LessonTimerBar elapsed tick | ANLY-02 | 1s tick timing flaky in CI | Start lesson; confirm subtitle updates within 2s |

*All critical business rules and auth gates have automated verification.*

---

## Validation Architecture

### student-metrics module (01-01)

- **Entry:** `src/shared/lib/student-metrics/index.ts`
- **Config:** `AT_RISK_CONFIG` (D-05) — single source for thresholds and `actualTimeSource`
- **Unit coverage:** period-metrics (ANLY-03, ANLY-04, ANLY-10), time-norm (D-01…D-03), attendance-risk (D-09), risk-flags (D-06)
- **D-04 migration gate:** After 01-03 timer verification, `actualTimeSource` defaults to `'teaching_session'`; unit test asserts `totalMinutes` and `evaluateTimeNormForLevel` use `durationMinutes`, not proxy formula

### at-risk API (01-02, 01-05)

- **Routes:** `/api/at-risk-students`, `/api/students/risk-flags`, `/api/student-metrics`
- **Auth:** `authorizeApiRequest` — STUDENT forbidden on at-risk (D-07)
- **Integration test:** `route.test.ts` mocks auth + prisma; minimum STUDENT → forbidden

### Timer verify (01-03)

- **API:** POST/PATCH `teaching-sessions`
- **Unit:** `teaching-session.test.ts` — `durationMinutes`, `isActive`
- **Linkage to metrics:** config switch per D-04 after ANLY-01 confirmed

### E2E (01-05)

- **Spec:** `e2e/student-analytics.spec.ts`
- **Teacher:** start/end lesson, duration visible, journal unblocked, at-risk table → history modal with «Длительность занятия» column header (ANLY-09)
- **Student portal:** `/student/me` metrics visible; no «Требуют внимания» (D-07)

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies documented
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers MISSING references (01-05 creates E2E + route test)
- [x] No watch-mode flags in verify commands
- [x] Feedback latency < 90s for quick unit runs
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
