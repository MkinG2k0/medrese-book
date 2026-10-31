---
phase: 13-journal
plan: 01
subsystem: journal
tags: [nextjs, journal, url-params, localStorage, prisma, server-actions]

requires:
  - phase: 12-progress-sessions
    provides: GroupEnrollment-scoped progress, Session by groupId
provides:
  - JOURNAL_GROUP_PARAM and buildJournalHref with optional groupId
  - resolveJournalGroupId whitelist validation
  - journal-storage keys and read/write helpers
  - getTeacherGroups server action with subject labels
  - useJournalDate groupId/setGroupId/journalHref contract
affects:
  - 13-02 (StudentList group Select UI)
  - 13-03 (lesson page group context and assertTeacherOwnsGroup wiring)
  - 13-04 (history pages separate storage key)

tech-stack:
  added: []
  patterns:
    - "URL ?groupId= + localStorage fallback for journal group context (D-10)"
    - "resolveJournalGroupId whitelist on client; server ownership in actions (T-13-02)"

key-files:
  created:
    - src/features/journal/lib/journal-storage.ts
    - src/features/journal/lib/journal-storage.test.ts
  modified:
    - src/features/journal/lib/journal-url.ts
    - src/features/journal/lib/journal-url.test.ts
    - src/features/journal/actions/journal-actions.ts
    - src/features/journal/model/use-journal-date.ts

key-decisions:
  - "buildJournalHref uses optional third param groupId for backward compat with existing callers"
  - "useJournalDate reads localStorage before defaultGroupId prop for D-03 default chain"
  - "getTeacherGroup kept with @deprecated until 13-02/04 call site migration"

patterns-established:
  - "Journal group context: URL param → localStorage → defaultGroupId fallback via resolveJournalGroupId"
  - "Separate storage keys for main journal vs history (D-14)"

requirements-completed: [SUBJ-11]

coverage:
  - id: D1
    description: "journal-url exports JOURNAL_GROUP_PARAM, buildJournalHref with groupId, resolveJournalGroupId"
    requirement: SUBJ-11
    verification:
      - kind: unit
        ref: "src/features/journal/lib/journal-url.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "journal-storage separate keys and SSR-safe read/write"
    requirement: SUBJ-11
    verification:
      - kind: unit
        ref: "src/features/journal/lib/journal-storage.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "getTeacherGroups returns teacher-owned groups with subjectName"
    requirement: SUBJ-11
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D4
    description: "useJournalDate syncs groupId to URL and localStorage"
    requirement: SUBJ-11
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Hook URL bootstrap behavior requires browser integration test; deferred to 13-02 UI wiring"

duration: 3min
completed: 2026-07-12
status: complete
---

# Phase 13 Plan 01: Journal Group Infrastructure Summary

**URL/storage contracts for groupId, getTeacherGroups with subject labels, and useJournalDate hook syncing group context**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-11T21:19:00Z
- **Completed:** 2026-07-11T21:22:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Расширен `journal-url.ts`: `JOURNAL_GROUP_PARAM`, `buildJournalHref` с опциональным `groupId`, `resolveJournalGroupId` с whitelist
- Создан `journal-storage.ts` с отдельными ключами для журнала и истории (D-14)
- Добавлен `getTeacherGroups()` — только группы текущего учителя с `subjectName` (D-02, D-05)
- Расширен `useJournalDate`: `groupId`, `setGroupId`, `journalHref` с сохранением date+groupId (D-10, D-11)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED:** `8d530e2` — test(13-01): add failing tests for journal groupId URL and storage
2. **Task 1 GREEN:** `cc55643` — feat(13-01): journal URL and storage contracts for groupId
3. **Task 2:** `2933a06` — feat(13-01): add getTeacherGroups server action with subject labels
4. **Task 3:** `1203b9e` — feat(13-01): sync journal groupId in URL via useJournalDate hook

## Files Created/Modified

- `src/features/journal/lib/journal-url.ts` — groupId query param и resolve helper
- `src/features/journal/lib/journal-url.test.ts` — unit-тесты URL/groupId
- `src/features/journal/lib/journal-storage.ts` — localStorage ключи и helpers
- `src/features/journal/lib/journal-storage.test.ts` — unit-тесты storage
- `src/features/journal/actions/journal-actions.ts` — TeacherJournalGroup, getTeacherGroups, assertTeacherOwnsGroup skeleton
- `src/features/journal/model/use-journal-date.ts` — groupId sync в URL и storage

## Decisions Made

- `buildJournalHref(pathname, date, groupId?)` — третий опциональный аргумент вместо объекта opts, чтобы не ломать существующие вызовы до планов 13-02/03
- Цепочка fallback groupId: URL → localStorage (если в allowed) → defaultGroupId prop
- `assertTeacherOwnsGroup` добавлен как private skeleton для плана 13-03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] journal-storage tests adapted for node vitest environment**
- **Found during:** Task 1 (journal-url и journal-storage)
- **Issue:** vitest `environment: node` has no localStorage/window; initial storage tests failed
- **Fix:** Mock localStorage/window via vi.stubGlobal; SSR test uses unstubbed globals
- **Files modified:** src/features/journal/lib/journal-storage.test.ts
- **Verification:** pnpm test:unit — 11 passed
- **Committed in:** cc55643 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test infrastructure fix only; no behavior change.

## Issues Encountered

None beyond vitest node environment (resolved via deviation above).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Инфраструктура groupId готова для плана 13-02 (Select группы в StudentList)
- `getTeacherGroups` и `useJournalDate({ allowedGroupIds, defaultGroupId })` готовы к wiring на странице журнала
- `assertTeacherOwnsGroup` skeleton готов для 13-03 server-side ownership checks

---
*Phase: 13-journal*
*Completed: 2026-07-12*

## Self-Check: PASSED

- All key files FOUND
- Commits 8d530e2, cc55643, 2933a06, 1203b9e verified in git log
