---
phase: 10-subject-foundation
plan: 02
subsystem: ui
tags: [antd, prisma, server-actions, vitest, subject-admin]

requires:
  - phase: 10-01
    provides: Subject Prisma model and Zod validations
provides:
  - subject-admin server actions with role guards
  - SubjectsList CRUD UI at /admin/subjects
  - AppShell navigation Предметы replacing Программа
affects: [10-03, 10-04]

tech-stack:
  added: []
  patterns:
    - "Server actions + GroupsList-style admin table with modals"
    - "App.useApp for modal.confirm and message (no static antd APIs)"

key-files:
  created:
    - src/features/subject-admin/actions/subject-actions.ts
    - src/features/subject-admin/actions/subject-actions.test.ts
    - src/features/subject-admin/ui/SubjectsList.tsx
    - src/features/subject-admin/ui/CreateSubjectForm.tsx
    - src/features/subject-admin/ui/EditSubjectForm.tsx
    - src/features/subject-admin/index.ts
    - src/app/(dashboard)/admin/subjects/page.tsx
  modified:
    - src/widgets/app-shell/ui/AppShell.tsx

key-decisions:
  - "Page imports getSubjects from actions; SubjectsList exported via barrel"
  - "stepCount aggregated in page from nested level _count.steps"
  - "Link to program uses default antd styling without GroupsList hex override"

patterns-established:
  - "subject-admin mirrors groups feature: actions + list + modal forms"
  - "deleteSubject level guard throws Russian UI-SPEC message for server and client"

requirements-completed: [SUBJ-01]

coverage:
  - id: D1
    description: "Subject server actions with delete guard and Zod validation"
    requirement: SUBJ-01
    verification:
      - kind: unit
        ref: "src/features/subject-admin/actions/subject-actions.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "SubjectsList CRUD UI with UI-SPEC copy and delete confirm"
    requirement: SUBJ-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json (subject-admin)"
        status: pass
    human_judgment: true
    rationale: "Visual modal/table layout and copy require human smoke on /admin/subjects"
  - id: D3
    description: "/admin/subjects page and AppShell Предметы navigation"
    requirement: SUBJ-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json (admin/subjects AppShell)"
        status: pass
    human_judgment: true
    rationale: "Menu label and route access need manager-role smoke test"

duration: 15min
completed: 2026-07-07
status: complete
---

# Phase 10 Plan 02: Subject CRUD Admin UI Summary

**Админка предметов: server actions с guard удаления, таблица с модалками на /admin/subjects, пункт меню «Предметы»**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-07T18:03:00Z
- **Completed:** 2026-07-07T18:18:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Server actions `getSubjects`, `getSubject`, `createSubject`, `updateSubject`, `deleteSubject` с `requireRoles` и блокировкой удаления при наличии уровней
- Vitest-покрытие: порядок сортировки, Zod-валидация имени, guard удаления
- `SubjectsList` с модалками создания/редактирования, confirm-удалением и UI-SPEC копирайтом
- Страница `/admin/subjects` для MANAGER/SUPER_ADMIN; меню AppShell: «Предметы» вместо «Программа»

## Task Commits

Each task was committed atomically:

1. **Task 1: Subject server actions and unit tests** - `d853b5e` (feat)
2. **Task 2: SubjectsList and subject forms** - `7ea4cd0` (feat)
3. **Task 3: Subjects page and AppShell navigation** - `43fd406` (feat)

## Files Created/Modified

- `src/features/subject-admin/actions/subject-actions.ts` - CRUD server actions with revalidatePath
- `src/features/subject-admin/actions/subject-actions.test.ts` - vitest mocks for prisma/session
- `src/features/subject-admin/ui/SubjectsList.tsx` - table, modals, delete flow
- `src/features/subject-admin/ui/CreateSubjectForm.tsx` - create modal form
- `src/features/subject-admin/ui/EditSubjectForm.tsx` - edit modal form
- `src/features/subject-admin/index.ts` - public barrel export
- `src/app/(dashboard)/admin/subjects/page.tsx` - server page with role guard
- `src/widgets/app-shell/ui/AppShell.tsx` - /admin/subjects menu entry

## Decisions Made

- Агрегация `stepCount` на странице из `levels._count.steps` — actions возвращают сырые Prisma-данные как в groups
- Пустое состояние: поясняющий `Text type="secondary"` под шапкой (без обязательного Empty)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Готово для 10-03: subject-scoped program-actions и deleteLevel
- Ссылка на `/admin/subjects/{id}/program` в таблице — маршрут появится в 10-04
- `/admin/program` route ещё существует (удаление в 10-04 по плану)

## Self-Check: PASSED

- FOUND: src/features/subject-admin/actions/subject-actions.ts
- FOUND: src/features/subject-admin/ui/SubjectsList.tsx
- FOUND: src/app/(dashboard)/admin/subjects/page.tsx
- FOUND: commit d853b5e
- FOUND: commit 7ea4cd0
- FOUND: commit 43fd406

---
*Phase: 10-subject-foundation*
*Completed: 2026-07-07*
