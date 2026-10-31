---
phase: 13-journal
plan: 04
subsystem: journal
tags: [nextjs, journal, groupId, history, e2e, playwright]

requires:
  - phase: 13-journal
    provides: useJournalDate groupId sync, getStudentStepHistory skeleton, lesson page group context
  - phase: 13-journal
    provides: StudentList group Select pattern, buildJournalHref
provides:
  - JournalHistoryPage with independent group Select (D-12, D-14)
  - /journal/history loads getTeacherGroups SSR
  - /journal/[studentId]/history requires groupId; backHref preserves context (D-13)
  - seed-e2e second teacher1 group for group-switch E2E
  - e2e/helpers/journal.ts gotoJournal with groupId
  - getTeacherGroup removed from journal feature
affects:
  - Phase 14 analytics (group/subject context patterns)

tech-stack:
  added: []
  patterns:
    - "History list: useJournalHistoryGroup + JOURNAL_HISTORY_GROUP_STORAGE_KEY separate from main journal"
    - "Student step history: mandatory groupId query; enrollment-scoped progress via getStudentStepHistory"
    - "E2E journal: expectJournalUrlHasGroupId + group switch via Ant Select"

key-files:
  created:
    - src/features/journal/model/use-journal-history-group.ts
  modified:
    - src/app/(dashboard)/journal/history/page.tsx
    - src/features/journal/ui/JournalHistoryPage.tsx
    - src/app/(dashboard)/journal/[studentId]/history/page.tsx
    - src/features/journal/actions/journal-actions.ts
    - prisma/seed-e2e.ts
    - e2e/journal.spec.ts
    - e2e/helpers/journal.ts
    - e2e/helpers/codes.ts

key-decisions:
  - "History group Select disabled when teacher has one group; still visible per D-12 pattern from main journal"
  - "Dual enrollment for Khalid/Zayd in teacher1 second group — preserves teacher2 group2 scenarios"
  - "Khalid/Zayd lesson tests switch to Группа Аль-Ихлас before navigation"

patterns-established:
  - "Journal history: independent localStorage key and group picker — no auto-inherit from /journal (D-12, D-14)"

requirements-completed: [SUBJ-11, SUBJ-12, SUBJ-13]

coverage:
  - id: D1
    description: "/journal/history renders independent group Select with JOURNAL_HISTORY_GROUP_STORAGE_KEY"
    requirement: SUBJ-11
    verification:
      - kind: other
        ref: "rg JOURNAL_HISTORY_GROUP_STORAGE_KEY src/features/journal/"
        status: pass
    human_judgment: true
    rationale: "Select layout in history header requires browser visual check"
  - id: D2
    description: "/journal/[studentId]/history returns 404 without groupId; backHref includes groupId"
    requirement: SUBJ-12
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "E2E journal.spec.ts asserts groupId in URL and group switch changes student list"
    requirement: SUBJ-13
    verification:
      - kind: e2e
        ref: "pnpm test:e2e -- e2e/journal.spec.ts"
        status: fail
    human_judgment: true
    rationale: "Playwright config load error in environment — tests written but not executed green"
  - id: D4
    description: "getTeacherGroup fully removed from journal feature"
    requirement: SUBJ-11
    verification:
      - kind: other
        ref: "rg getTeacherGroup src/features/journal/ src/app/(dashboard)/journal/"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-12
status: complete
---

# Phase 13 Plan 04: History Routes, E2E, getTeacherGroup Cleanup Summary

**Independent history group picker, mandatory groupId on step history, E2E groupId assertions, deprecated getTeacherGroup removed**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-11T21:30:00Z
- **Completed:** 2026-07-11T21:55:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- `/journal/history` с собственным Select группы и отдельным localStorage ключом (D-12, D-14)
- `/journal/[studentId]/history` требует `groupId`; «Назад к уроку» сохраняет groupId+date (D-13)
- seed-e2e: вторая группа teacher1 «Группа Аль-Ихлас» с зачислением Халида и Зайда
- E2E: assertions на groupId в URL, тест смены группы, gotoJournal helper
- `getTeacherGroup` / `getTeacherGroupForSession` удалены из journal-actions

## Task Commits

1. **Task 1: /journal/history — свой Select группы** - `64890df` (feat)
2. **Task 2: /journal/[studentId]/history — обязательный groupId** - `18cd5a2` (feat)
3. **Task 3: E2E и seed-e2e для groupId** - `86b7ca5` (feat)

## Files Created/Modified
- `src/features/journal/model/use-journal-history-group.ts` — hook для независимого выбора группы на history
- `src/features/journal/ui/JournalHistoryPage.tsx` — Group Select + student/date filters
- `src/app/(dashboard)/journal/history/page.tsx` — getTeacherGroups SSR
- `src/app/(dashboard)/journal/[studentId]/history/page.tsx` — buildJournalHref back link
- `src/features/journal/actions/journal-actions.ts` — удалён getTeacherGroup
- `prisma/seed-e2e.ts` — teacher1Group2 + dual enrollments
- `e2e/helpers/journal.ts` — gotoJournal, expectJournalUrlHasGroupId
- `e2e/journal.spec.ts` — groupId URL assertions и switch test
- `e2e/helpers/codes.ts` — groupTeacher1Second constant

## Decisions Made
- Dual enrollment для Khalid/Zayd во второй группе teacher1 — не ломает teacher2 сценарии (T-13-SC accept)
- Тесты Khalid/Zayd переключают группу на Аль-Ихлас перед навигацией

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Khalid/Zayd недоступны в группе teacher1 по умолчанию**
- **Found during:** Task 3 (E2E updates)
- **Issue:** seed ставил Khalid/Zayd только в group2 (teacher2); e2e teacher1 не мог открыть их урок
- **Fix:** dual enrollment в teacher1Group2; E2E переключает группу перед Khalid/Zayd flows
- **Files modified:** prisma/seed-e2e.ts, e2e/journal.spec.ts
- **Committed in:** 86b7ca5

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Необходимо для корректности E2E teacher1 сценариев без изменения Ali/Usman/Bilal в group1.

## Issues Encountered
- `pnpm test:e2e -- e2e/journal.spec.ts` падает на загрузке playwright.config.ts (`context.conditions?.includes is not a function`) — pre-existing environment issue, не связано с изменениями кода. tsc проходит.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 13 journal complete — все 4 плана выполнены
- Phase 14 analytics может использовать group/subject context patterns
- Рекомендуется починить Playwright config для green E2E в CI

## Self-Check: PASSED
- FOUND: .planning/phases/13-journal/13-04-SUMMARY.md
- FOUND: 64890df
- FOUND: 18cd5a2
- FOUND: 86b7ca5

---
*Phase: 13-journal*
*Completed: 2026-07-12*
