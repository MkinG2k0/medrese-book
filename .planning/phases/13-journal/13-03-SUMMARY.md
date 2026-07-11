---
phase: 13-journal
plan: 03
subsystem: journal
tags: [nextjs, journal, groupId, server-actions, vitest, lesson-page]

requires:
  - phase: 13-journal
    provides: useJournalDate groupId sync, buildJournalHref, getTeacherGroups
  - phase: 12-progress-sessions
    provides: Session scoped by groupId, enrollment progress
provides:
  - getStudentLesson(studentId, date, groupId) with assertTeacherOwnsGroup
  - Lesson route requires groupId query param (404 without)
  - LessonPageHeader «Группа · Предмет» context (D-08)
  - Navigation preserves groupId+date (D-11)
  - journal-actions.test.ts ownership and scoping tests
affects:
  - 13-04 (history routes, E2E, getTeacherGroup removal)

tech-stack:
  added: []
  patterns:
    - "Lesson page: mandatory ?groupId= in URL; server assertTeacherOwnsGroup (T-13-05)"
    - "useJournalDate scoped with allowedGroupIds=[groupId] on lesson page for back/save-and-next"
    - "Session POST/GET includes groupId from lesson context (Phase 12 contract)"

key-files:
  created:
    - src/features/journal/actions/journal-actions.test.ts
  modified:
    - src/features/journal/actions/journal-actions.ts
    - src/app/(dashboard)/journal/[studentId]/page.tsx
    - src/features/journal/lib/lesson-types.ts
    - src/features/journal/ui/lesson/LessonPageHeader.tsx
    - src/features/journal/model/use-lesson-page.ts
    - src/features/journal/ui/LessonPage.tsx
    - src/entities/session/api/use-sessions.ts
    - src/features/journal/ui/JournalStudentsTable.tsx
    - src/app/(dashboard)/journal/[studentId]/history/page.tsx

key-decisions:
  - "getTeacherGroup/getTeacherGroupForSession kept for /journal/history until 13-04"
  - "Student step history route minimally updated with required groupId for tsc compatibility"
  - "useStudentSession and createSession extended with groupId to satisfy Phase 12 API schema"

patterns-established:
  - "Lesson server actions: groupId required param + assertTeacherOwnsGroup, no findFirst group fallback (D-05)"

requirements-completed: [SUBJ-13]

coverage:
  - id: D1
    description: "getStudentLesson rejects foreign groupId and scopes groupEnrollments to targetGroupId"
    requirement: SUBJ-13
    verification:
      - kind: unit
        ref: "src/features/journal/actions/journal-actions.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "/journal/[studentId] requires groupId query or returns 404"
    requirement: SUBJ-13
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "LessonPageHeader shows groupName · subjectName and history link with groupId"
    requirement: SUBJ-13
    verification:
      - kind: other
        ref: "rg groupName|subjectName src/features/journal/ui/lesson/LessonPageHeader.tsx"
        status: pass
    human_judgment: true
    rationale: "Secondary text layout in header requires browser visual check"

duration: 20min
completed: 2026-07-12
status: complete
---

# Phase 13 Plan 03: Lesson Page Group Context Summary

**Страница урока с обязательным groupId: assertTeacherOwnsGroup на сервере, шапка «Группа · Предмет», навигация сохраняет контекст группы**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-11T21:25:00Z
- **Completed:** 2026-07-11T21:45:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `getStudentLesson` требует `groupId`, проверяет владение группой и возвращает `groupName`/`subjectName`
- Исправлен баг: `groupEnrollments` scoped к `targetGroupId`, не к `findFirst` группе
- `/journal/[studentId]` без `?groupId=` → 404
- `LessonPageHeader` показывает контекст «Группа · Предмет» (D-08)
- «Назад», save-and-next и «История шагов» сохраняют `groupId` (D-11)
- Сохранение сессии передаёт `groupId` в POST `/api/sessions`

## Task Commits

Each task was committed atomically:

1. **Task 1: journal-actions — groupId обязателен в lesson paths** — `5f48c52` (feat)
2. **Task 2: Student lesson page — groupId из URL** — `0093fab` (feat)
3. **Task 3: LessonPageHeader и навигация с groupId** — `cddabc1` (feat)

## Files Created/Modified

- `src/features/journal/actions/journal-actions.test.ts` — vitest: ownership, scoping, groupName/subjectName
- `src/features/journal/actions/journal-actions.ts` — обязательный groupId, assertTeacherOwnsGroup, bugfix line 250
- `src/app/(dashboard)/journal/[studentId]/page.tsx` — groupId из searchParams, notFound без него
- `src/features/journal/lib/lesson-types.ts` — groupName, subjectName в LessonPageProps
- `src/features/journal/ui/lesson/LessonPageHeader.tsx` — контекст группы/предмета, history link
- `src/features/journal/model/use-lesson-page.ts` — useJournalDate scoped, groupId в session API
- `src/entities/session/api/use-sessions.ts` — groupId в create/fetch session

## Decisions Made

- `getTeacherGroup` оставлен deprecated до 13-04 (call site `/journal/history`)
- Маршрут `[studentId]/history` минимально обновлён для совместимости с новой сигнатурой `getStudentStepHistory`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] resumeStudentFromPause и getNextLevelJournalSteps call sites**
- **Found during:** Task 1
- **Issue:** Смена сигнатур ломала JournalStudentsTable и use-lesson-page
- **Fix:** Передача `journalGroupId` / `groupId` в вызовах
- **Files modified:** JournalStudentsTable.tsx, use-lesson-page.ts
- **Committed in:** `5f48c52`

**2. [Rule 3 - Blocking] Student history page tsc after getStudentStepHistory signature**
- **Found during:** Task 2 verify
- **Issue:** `getStudentStepHistory(studentId)` — Expected 2 arguments
- **Fix:** Добавлен обязательный `groupId` из searchParams + notFound
- **Files modified:** `[studentId]/history/page.tsx`
- **Committed in:** `0093fab`

**3. [Rule 2 - Missing Critical] Session API calls without groupId**
- **Found during:** Task 3
- **Issue:** POST `/api/sessions` требует groupId (Phase 12), но useCreateSession не передавал
- **Fix:** groupId в CreateSessionPayload, useStudentSession query, use-lesson-page mutations
- **Files modified:** use-sessions.ts, use-lesson-page.ts
- **Committed in:** `cddabc1`

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking)
**Impact on plan:** Все правки необходимы для корректной работы урока в контексте группы. Без scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Готов 13-04: history routes, E2E под groupId, удаление getTeacherGroup
- E2E `journal.spec.ts` ещё не обновлён под обязательный groupId на странице урока

## Self-Check: PASSED

- FOUND: `.planning/phases/13-journal/13-03-SUMMARY.md`
- FOUND: commit `5f48c52`
- FOUND: commit `0093fab`
- FOUND: commit `cddabc1`

---
*Phase: 13-journal*
*Completed: 2026-07-12*
