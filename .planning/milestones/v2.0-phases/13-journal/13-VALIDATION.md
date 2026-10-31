---
phase: 13
slug: journal
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-12
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.9 (unit) + Playwright 1.61.0 (E2E in 13-04) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm test:unit -- src/features/journal/lib/journal-url.test.ts` |
| **Full suite command** | `pnpm test:unit -- src/features/journal/lib/journal-url.test.ts src/features/journal/actions/journal-actions.test.ts && pnpm test:e2e -- e2e/journal.spec.ts` |
| **Estimated runtime** | ~90 seconds (unit ~15s, E2E ~75s) |

---

## Sampling Rate

- **After every task commit:** targeted `pnpm test:unit -- <file>` when tests exist; scoped `rg` pattern checks for UI/wiring tasks; `pnpm exec tsc --noEmit` for compile-only tasks (13-01-02, 13-01-03, 13-02-02, 13-03-02, 13-04-02)
- **After every plan wave:** wave unit tests green; `pnpm exec tsc --noEmit` after waves 2–4
- **Before `/gsd-verify-work`:** full phase 13 unit suite + `pnpm test:e2e -- e2e/journal.spec.ts` + `pnpm exec tsc --noEmit` green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | SUBJ-11 | T-13-02 | buildJournalHref + resolveJournalGroupId with groupId | unit | `pnpm test:unit -- src/features/journal/lib/journal-url.test.ts` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | SUBJ-11 | T-13-01 | getTeacherGroups only own groups with subjectName | manual | `pnpm exec tsc --noEmit && rg "getTeacherGroups|TeacherJournalGroup" src/features/journal/actions/journal-actions.ts` | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | SUBJ-11 | T-13-02 | useJournalDate groupId URL + localStorage sync | manual | `pnpm exec tsc --noEmit && rg "groupId|setGroupId|JOURNAL_GROUP_STORAGE_KEY" src/features/journal/model/use-journal-date.ts` | ✅ | ⬜ pending |
| 13-02-01 | 02 | 2 | SUBJ-11 | — | page.tsx uses getTeacherGroups, not getTeacherGroup | manual | `rg "getTeacherGroup" "src/app/(dashboard)/journal/page.tsx"; test $? -ne 0` | ✅ | ⬜ pending |
| 13-02-02 | 02 | 2 | SUBJ-11, SUBJ-12 | T-13-03 | Group Select in header; timer/session scoped to groupId | manual | `pnpm exec tsc --noEmit && rg "Select|useTeachingSession|LessonTimerBar" src/features/journal/ui/StudentList.tsx` | ✅ | ⬜ pending |
| 13-02-03 | 02 | 2 | SUBJ-11, SUBJ-12 | — | Lesson links preserve groupId+date (D-11) | manual | `rg "groupId|JOURNAL_GROUP_PARAM|journalGroupId" src/features/journal/ui/JournalStudentsTable.tsx` | ✅ | ⬜ pending |
| 13-03-01 | 03 | 3 | SUBJ-13 | T-13-05 | getStudentLesson requires groupId; assertTeacherOwnsGroup | unit | `pnpm test:unit -- src/features/journal/actions/journal-actions.test.ts` | ❌ W0 | ⬜ pending |
| 13-03-02 | 03 | 3 | SUBJ-13 | T-13-05 | /journal/[studentId] without groupId → notFound | manual | `pnpm exec tsc --noEmit && rg "notFound|JOURNAL_GROUP_PARAM|groupId" src/app/(dashboard)/journal/[studentId]/page.tsx` | ✅ | ⬜ pending |
| 13-03-03 | 03 | 3 | SUBJ-13 | T-13-06 | LessonPageHeader «Группа · Предмет»; back href with groupId | manual | `rg "groupName|subjectName" src/features/journal/ui/lesson/LessonPageHeader.tsx && rg "journalHref|groupId" src/features/journal/model/use-lesson-page.ts` | ✅ | ⬜ pending |
| 13-04-01 | 04 | 4 | SUBJ-11 | — | /journal/history independent Group Select (D-12, D-14) | manual | `rg "JOURNAL_HISTORY_GROUP_STORAGE_KEY" src/features/journal/` | ✅ | ⬜ pending |
| 13-04-02 | 04 | 4 | SUBJ-12, SUBJ-13 | T-13-05 | /journal/[studentId]/history requires groupId (D-13) | manual | `pnpm exec tsc --noEmit && rg "notFound|getStudentStepHistory" src/app/(dashboard)/journal/[studentId]/history/page.tsx` | ✅ | ⬜ pending |
| 13-04-03 | 04 | 4 | SUBJ-11, SUBJ-12, SUBJ-13 | T-13-07 | E2E journal with groupId in URL; group switch | e2e | `pnpm test:e2e -- e2e/journal.spec.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/journal/actions/journal-actions.test.ts` — getStudentLesson groupId ownership: чужой groupId → null; валидный groupId → return.groupId совпадает; assertTeacherOwnsGroup teacherId mismatch (created in 13-03-01 TDD task before implementation)

*Existing `src/features/journal/lib/journal-url.test.ts` covers 13-01-01; no additional Wave 0 stubs required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Group switch during active teaching session | SUBJ-11 | Modal UX discretion (D-03) | Start lesson in group A; switch Select to group B; confirm modal appears; onOk switches context |
| History independent group default | SUBJ-11 | localStorage isolation | Visit /journal, select group A; visit /journal/history; verify group B (or history default) not auto-inherited from main journal (D-12) |
| Timer/session subject via groupId | ROADMAP §4 | Integration across hooks + API | Select group; start LessonTimerBar; verify POST /api/teaching-sessions includes groupId; save session preserves groupId |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (journal-actions.test.ts)
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Verify commands fail on compile errors (no `|| echo` masking)

**Approval:** pending
