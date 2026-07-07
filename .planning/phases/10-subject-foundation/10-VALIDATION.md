---
phase: 10
slug: subject-foundation
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-07
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.9 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test:unit` |
| **Full suite command** | `pnpm test:unit` |
| **E2E** | Playwright 1.61.0 — `pnpm test:e2e` |
| **Estimated runtime** | ~30 seconds (unit) |

---

## Sampling Rate

- **After every task commit:** `pnpm test:unit` (targeted file when tests added)
- **After every plan wave:** `pnpm test:unit`
- **Before `/gsd-verify-work`:** Full unit suite green + manual smoke `/admin/subjects` → program → step editor
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SUBJ-18 | T-10-SC | Prisma migration safe ops only | manual | `pnpm exec prisma validate` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | SUBJ-02 | — | Zod schemas parse subjectId | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 10-01-03 | 01 | 1 | SUBJ-18 | — | Migration deploys on local DB | manual | `pnpm db:migrate` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 2 | SUBJ-01 | T-10-01 | requireRoles on actions | unit | `pnpm test:unit -- subject-actions.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 2 | SUBJ-01 | T-10-02 | deleteSubject blocks when levels exist | unit | same | ❌ W0 | ⬜ pending |
| 10-02-03 | 02 | 2 | SUBJ-01 | — | /admin/subjects page renders | e2e | `pnpm test:e2e -- e2e/admin-subjects.spec.ts` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | SUBJ-02 | — | program-paths helpers | unit | `pnpm exec tsc --noEmit` | ❌ W0 | ⬜ pending |
| 10-03-02 | 03 | 2 | SUBJ-02 | T-10-07 | getLevelSteps IDOR guard | unit | `pnpm test:unit -- program-actions.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-03 | 03 | 2 | SUBJ-18 | — | offsets per subjectId | unit | `pnpm test:unit -- offsets.test.ts` | ❌ W0 | ⬜ pending |
| 10-05-01 | 05 | 2 | SUBJ-18 | — | seed creates 3 subjects | manual | `pnpm db:seed` | ✅ | ⬜ pending |
| 10-04-01 | 04 | 3 | SUBJ-04 | — | UI components subjectId props | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 10-04-02 | 04 | 3 | SUBJ-04 | T-10-10 | route pages auth + notFound | e2e | `pnpm test:e2e -- e2e/admin-subjects.spec.ts` | ❌ W0 | ⬜ pending |
| 10-04-03 | 04 | 3 | SUBJ-04 | — | no /admin/program in src | unit | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/subject-admin/actions/subject-actions.test.ts` — delete guard, validation (SUBJ-01)
- [ ] `src/features/program-admin/actions/program-actions.test.ts` — subject scoping, deleteLevel (SUBJ-02)
- [ ] `src/shared/lib/student-progress/offsets.test.ts` — subject-scoped offsets (SUBJ-18)
- [ ] `e2e/admin-subjects.spec.ts` — smoke: list subjects, open program (SUBJ-01, SUBJ-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tiptap step editor save | SUBJ-04 | Rich text E2E heavy | Open step edit, save, verify redirect to level |
| Migration on prod | SUBJ-18 | No prod in CI | `pnpm db:migrate:deploy` on staging |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-07
