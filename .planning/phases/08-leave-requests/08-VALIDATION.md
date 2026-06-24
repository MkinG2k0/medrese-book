---
phase: 8
slug: leave-requests
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-25
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.0 + ESLint + `tsc --noEmit` |
| **Config file** | `playwright.config.ts`, `eslint.config.mjs` |
| **Quick run command** | `pnpm lint -- --max-warnings=0 src/features/leave-requests` |
| **Full suite command** | `pnpm test:e2e e2e/leave-requests.spec.ts` |
| **Estimated runtime** | ~45 seconds (quick lint), ~90 seconds (leave E2E) |

---

## Sampling Rate

- **After every task commit:** Task-specific `<automated>` from PLAN.md
- **After every plan wave:** `pnpm exec tsc --noEmit` + wave-appropriate E2E smoke
- **Before `/gsd-verify-work`:** `pnpm test:e2e e2e/leave-requests.spec.ts` must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-T1 | 01 | 1 | LEAV-05 | — | schema valid | prisma | `pnpm prisma validate` | ✅ | ⬜ pending |
| 08-01-T2 | 01 | 1 | LEAV-05, TCHR-05 | — | types compile | tsc | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 08-01-T3 | 01 | 1 | LEAV-05, TCHR-05 | — | migration applied | migrate | `pnpm prisma migrate status` | ✅ | ⬜ pending |
| 08-02-T1 | 02 | 2 | LEAV-02,03,04 | T-08-04 | manager-only approve | tsc | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 08-02-T2 | 02 | 2 | LEAV-01 | T-08-05 | teacher IDOR scope | lint | `pnpm lint -- --max-warnings=0 src/app/api/leave-requests/route.ts` | ✅ | ⬜ pending |
| 08-02-T3 | 02 | 2 | TCHR-01,04 | T-08-06/07 | substitution auth | tsc | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 08-03-T1 | 03 | 3 | LEAV-02 | T-08-09 | route guard TEACHER | lint | `pnpm lint -- --max-warnings=0 src/app/(dashboard)/calendar/page.tsx` | ✅ | ⬜ pending |
| 08-03-T2 | 03 | 3 | LEAV-01,05 | — | calendar renders | lint | `pnpm lint -- --max-warnings=0 src/features/leave-requests/ui/LeaveCalendar.tsx` | ✅ | ⬜ pending |
| 08-03-T3 | 03 | 3 | LEAV-02,05 | — | create modal | lint | `pnpm lint -- --max-warnings=0 src/features/leave-requests/ui/CreateLeaveModal.tsx` | ✅ | ⬜ pending |
| 08-04-T1 | 04 | 4 | LEAV-01 | T-08-10 | manager route guard | lint | `pnpm lint -- --max-warnings=0 src/app/(dashboard)/admin/leave-calendar/page.tsx` | ✅ | ⬜ pending |
| 08-04-T2 | 04 | 4 | LEAV-01,03 | — | grid + calendar | lint | `pnpm lint -- --max-warnings=0 src/features/leave-requests/ui/ManagerLeaveCalendarPage.tsx` | ✅ | ⬜ pending |
| 08-04-T3 | 04 | 4 | LEAV-03,04 | T-08-11 | approve/reject modals | lint | `pnpm lint -- --max-warnings=0 src/features/leave-requests/ui/ApproveLeaveModal.tsx` | ✅ | ⬜ pending |
| 08-04-T4 | 04 | 4 | LEAV-03 | — | human checkpoint | manual | `echo "Human checkpoint — manager flow"` | ✅ | ⬜ pending |
| 08-05-T1 | 05 | 5 | LEAV-02 | — | helpers compile | tsc | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 08-05-T2 | 05 | 5 | LEAV-01…05, TCHR-01,03,04 | T-08-16/17 | full leave E2E | e2e | `pnpm test:e2e e2e/leave-requests.spec.ts` | ✅ | ⬜ pending |
| 08-05-T3 | 05 | 5 | TCHR-05, FND-04 | T-08-18 | audit on create | e2e | `pnpm test:e2e e2e/domain-events.spec.ts -g "LEAVE"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Fast Smoke Commands (Wave Boundaries)

| Wave | Smoke command |
|------|---------------|
| 1 | `pnpm prisma validate && pnpm exec tsc --noEmit` |
| 2 | `pnpm lint -- --max-warnings=0 src/features/leave-requests src/shared/lib/substitution-access.ts` |
| 3 | `pnpm lint -- --max-warnings=0 src/features/leave-requests/ui` |
| 4 | `pnpm lint -- --max-warnings=0 src/app/(dashboard)/admin/leave-calendar` |
| 5 | `pnpm test:e2e e2e/leave-requests.spec.ts -g "создаёт отпуск"` |

---

## Wave 0 Requirements

Existing infrastructure covers phase requirements (Playwright, Prisma, ESLint from Phase 0).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Manager calendar badge colors | LEAV-01 | Visual gray/green | Manager login → `/admin/leave-calendar` → verify CREATED gray, APPROVED green badges |
| Plan 04 checkpoint | LEAV-03 | Human UX review | Manager approve/reject flow end-to-end in browser |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
