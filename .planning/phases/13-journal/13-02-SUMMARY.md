---
phase: 13-journal
plan: 02
subsystem: journal
tags: [nextjs, ant-design, journal, group-select, enrollment-progress]

requires:
  - phase: 13-journal
    provides: getTeacherGroups, useJournalDate groupId sync, buildJournalHref with groupId
provides:
  - Journal page SSR with teacher groups list and empty state
  - Group Select in StudentList header row with subject in option labels
  - Lesson navigation links preserving groupId and date query params
affects:
  - 13-03 (lesson page group context)
  - 13-04 (history pages group picker)

tech-stack:
  added: []
  patterns:
    - "Server loads groups[] → Client resolves active groupId via useJournalDate (D-03, D-05)"
    - "Group Select option label «Название — Предмет» without separate subject picker (D-06, D-07)"
    - "modal.confirm before group switch during active teaching session (T-13-04)"

key-files:
  created: []
  modified:
    - src/app/(dashboard)/journal/page.tsx
    - src/features/journal/ui/StudentList.tsx
    - src/features/journal/ui/JournalStudentsTable.tsx

key-decisions:
  - "Select disabled when teacher has only one group but still visible with single option"
  - "Active lesson guard uses teachingSession.isActive (DTO field) not deprecated status enum"
  - "journalGroupId required prop on JournalStudentsTable — single call site in StudentList"

patterns-established:
  - "Journal main page: getTeacherGroups SSR → StudentList with allowedGroupIds whitelist via useJournalDate"

requirements-completed: [SUBJ-11, SUBJ-12]

coverage:
  - id: D1
    description: "Journal page loads teacher groups via getTeacherGroups with empty state when none assigned"
    requirement: SUBJ-11
    verification:
      - kind: other
        ref: "rg getTeacherGroup\\(\\) src/app/(dashboard)/journal/page.tsx — 0 matches"
        status: pass
    human_judgment: false
  - id: D2
    description: "Group Select in header row with «Группа — Предмет» labels and URL/storage sync"
    requirement: SUBJ-11
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Select layout and group-switch modal require browser visual verification"
  - id: D3
    description: "JournalStudentsTable lesson links include groupId and date in URL"
    requirement: SUBJ-12
    verification:
      - kind: other
        ref: "rg journalGroupId src/features/journal/ui/JournalStudentsTable.tsx"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-12
status: complete
---

# Phase 13 Plan 02: Journal Group Select UI Summary

**Ant Design group Select on /journal with enrollment-scoped student list and groupId preserved in lesson links**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-11T21:25:00Z
- **Completed:** 2026-07-11T21:40:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Страница `/journal` загружает `getTeacherGroups()` и показывает пустое состояние без групп
- В шапке `StudentList` — Select группы в одной строке с датой; опции «Группа — Предмет»
- `groupId` из URL/localStorage управляет списком учеников, таймером и teaching session
- Ссылки на урок из таблицы содержат `?groupId=` и `?date=` через `buildJournalHref`
- Подтверждение при смене группы во время активного урока

## Task Commits

Each task was committed atomically:

1. **Task 1: journal/page.tsx — группы и default groupId** — `bbc2ff5` (feat)
2. **Task 2: StudentList — Select группы в шапке** — `48b4844` (feat)
3. **Task 3: JournalStudentsTable — ссылки с groupId** — `4b77150` (feat)

## Files Created/Modified

- `src/app/(dashboard)/journal/page.tsx` — SSR getTeacherGroups, empty state, groups prop
- `src/features/journal/ui/StudentList.tsx` — Group Select, useJournalDate wiring, active-lesson guard
- `src/features/journal/ui/JournalStudentsTable.tsx` — journalGroupId prop in navigation hrefs

## Decisions Made

- Select disabled при одной группе, но отображается с единственной опцией (план D-04 discretion)
- Guard смены группы проверяет `teachingSession.isActive` (TeachingSessionDto), не Prisma status
- Текст modal.confirm из плана: «Урок идёт в другой группе. Переключить?»

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Главная страница журнала готова для плана 13-03 (страница урока с контекстом группы/предмета)
- `getTeacherGroup()` deprecated — остаётся для history pages до 13-04
- E2E journal.spec.ts ещё не обновлён под groupId (deferred per CONTEXT)

---
*Phase: 13-journal*
*Completed: 2026-07-12*

## Self-Check: PASSED

- All key files FOUND
- Commits bbc2ff5, 48b4844, 4b77150 verified in git log
