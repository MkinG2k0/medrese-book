---
phase: 10-subject-foundation
plan: 04
subsystem: ui
tags: [nextjs, antd, program-admin, subject-admin, tiptap]

requires:
  - phase: 10-02
    provides: SubjectsList and /admin/subjects routes
  - phase: 10-03
    provides: subject-scoped program-actions, program-paths, legacy route removal
provides:
  - subject-scoped program editor UI and route tree
  - CreateLevelForm modal and deleteLevel in LevelsTable
  - LevelStepsView with breadcrumbs and EditLevelForm modal
  - StepForm redirects via program-paths helpers
affects: [10-05]

tech-stack:
  added: []
  patterns:
    - "ProgramSubjectView and LevelStepsView client wrappers for modal state"
    - "subjectId prop threaded through all program-admin UI links"
    - "getStepOffsetForLevel(level.number, subjectId) for per-subject global step numbers"

key-files:
  created:
    - src/app/(dashboard)/admin/subjects/[subjectId]/program/page.tsx
    - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/page.tsx
    - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/new/page.tsx
    - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
    - src/features/program-admin/ui/CreateLevelForm.tsx
    - src/features/program-admin/ui/EditLevelForm.tsx
    - src/features/program-admin/ui/ProgramSubjectView.tsx
    - src/features/program-admin/ui/LevelStepsView.tsx
  modified:
    - src/features/program-admin/ui/LevelsTable.tsx
    - src/features/program-admin/ui/LevelStepsTable.tsx
    - src/features/program-admin/ui/StepForm.tsx
    - README.md

key-decisions:
  - "EditLevelForm and LevelStepsView added to restore Редактировать уровень UX (old /edit route never existed)"
  - "Deleted .next cache to clear stale validator types after legacy route removal"

patterns-established:
  - "Program list uses modal CreateLevelForm instead of broken /new link"
  - "StepForm uses router.push(programLevelPath) instead of window.location.href"

requirements-completed: [SUBJ-04]

coverage:
  - id: D1
    description: "Program UI components accept subjectId; no hardcoded /admin/program links"
    requirement: SUBJ-04
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json (program-admin/ui filter)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full program editor route tree under /admin/subjects/[subjectId]/program"
    requirement: SUBJ-04
    verification:
      - kind: other
        ref: "pnpm build — routes /admin/subjects/[subjectId]/program/** listed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zero /admin/program references in src/"
    requirement: SUBJ-04
    verification:
      - kind: other
        ref: "grep /admin/program src/ — no matches"
        status: pass
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-07
status: complete
---

# Phase 10 Plan 04: Subject-Scoped Program Editor UI Summary

**Subject-scoped program editor at /admin/subjects/[subjectId]/program with modal level create, deleteLevel, breadcrumbs, and Tiptap step save redirects**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-07T18:30:00Z
- **Completed:** 2026-07-07T18:55:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Refactored LevelsTable, LevelStepsTable, StepForm for subjectId-scoped program-paths links
- Added CreateLevelForm modal, EditLevelForm, ProgramSubjectView, LevelStepsView with delete level confirm
- Created full route tree: program list, level steps, step new/edit under /admin/subjects
- Per-subject global step numbers via getStepOffsetForLevel(level.number, subjectId)
- Zero /admin/program references in src/; README routes updated; pnpm build passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor program UI components for subjectId** - `1c0f07e` (feat)
2. **Task 2: Subject-scoped program route pages** - `0fcf086` (feat)
3. **Task 3: Verify no legacy /admin/program references** - `e15e3db` (docs)

**Plan metadata:** `b4783ee` (docs: complete plan)

## Files Created/Modified

- `src/features/program-admin/ui/CreateLevelForm.tsx` — modal form for new level with subjectId
- `src/features/program-admin/ui/EditLevelForm.tsx` — modal form for level title/number edit
- `src/features/program-admin/ui/ProgramSubjectView.tsx` — program list page client shell with empty state
- `src/features/program-admin/ui/LevelStepsView.tsx` — level steps header, breadcrumbs, edit modal
- `src/app/(dashboard)/admin/subjects/[subjectId]/program/page.tsx` — subject program levels list
- `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/page.tsx` — level steps table
- `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/new/page.tsx` — new step
- `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx` — edit step
- `src/features/program-admin/ui/LevelsTable.tsx` — subjectId links and deleteLevel action
- `src/features/program-admin/ui/LevelStepsTable.tsx` — subject-scoped edit links
- `src/features/program-admin/ui/StepForm.tsx` — subjectId redirect after save
- `README.md` — updated route table

## Decisions Made

- Added EditLevelForm and LevelStepsView beyond minimal plan file list to implement UI-SPEC «Редактировать уровень» button (legacy /edit route never existed)
- Cleared `.next` cache during verification to resolve stale validator types referencing deleted /admin/program routes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared stale .next cache for tsc**
- **Found during:** Task 3 (full tsc verification)
- **Issue:** `.next/dev/types/validator.ts` referenced deleted `/admin/program` pages causing TS2307 errors
- **Fix:** Removed `.next` directory; tsc and build pass cleanly
- **Files modified:** none (runtime cache only)
- **Verification:** `pnpm exec tsc --noEmit` and `pnpm build` exit 0
- **Committed in:** not committed (generated cache)

**2. [Rule 2 - Missing Critical] Added EditLevelForm and LevelStepsView**
- **Found during:** Task 2 (level steps page)
- **Issue:** UI-SPEC requires «Редактировать уровень» button; old route `/admin/program/[levelId]/edit` never existed
- **Fix:** EditLevelForm modal in LevelStepsView client wrapper
- **Files modified:** EditLevelForm.tsx, LevelStepsView.tsx
- **Committed in:** `1c0f07e` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking cache, 1 missing critical UX)
**Impact on plan:** Both necessary for build pass and UI-SPEC compliance. No scope creep beyond program editor.

## Issues Encountered

- Stale `.next` validator types after 10-03 route deletion — resolved by cache clear before build

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Program editor fully navigable: subjects → program → level → step editor
- Ready for 10-05 (remaining phase tasks / verification)
- E2E smoke for subject program flow optional per RESEARCH

## Self-Check: PASSED

- FOUND: src/app/(dashboard)/admin/subjects/[subjectId]/program/page.tsx
- FOUND: src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/page.tsx
- FOUND: src/features/program-admin/ui/CreateLevelForm.tsx
- FOUND: commit 1c0f07e
- FOUND: commit 0fcf086
- FOUND: commit e15e3db

---
*Phase: 10-subject-foundation*
*Completed: 2026-07-07*
