---
phase: 11-groups-enrollment
plan: 02
subsystem: groups
tags: [prisma, enrollments, subject, antd, vitest, playwright]

requires:
  - phase: 11-01
    provides: Group.subjectId, GroupEnrollment schema без Student.groupId
  - phase: 11-05
    provides: seed-e2e с GroupEnrollment fixtures
provides:
  - group-actions с subjectId и enrollments queries
  - UI создания/редактирования групп с предметом (D-06, D-07, D-08)
  - Страницы groups/my-group на enrollment shape
  - E2E scaffold groups-enrollment.spec.ts
affects:
  - 11-03 (enrollment UI на GroupStudentsTable)
  - 11-04 (full repo tsc)

tech-stack:
  added: []
  patterns:
    - "createGroupSchema/updateGroupSchema из shared/lib/validations/group.ts"
    - "enrollmentInclude для getGroup/getMyGroup"
    - "GroupsList subjectFilters по паттерну UsersTable"

key-files:
  created:
    - src/features/groups/actions/group-actions.test.ts
    - e2e/groups-enrollment.spec.ts
  modified:
    - src/features/groups/actions/group-actions.ts
    - src/features/groups/ui/GroupsList.tsx
    - src/features/groups/ui/CreateGroupForm.tsx
    - src/features/groups/ui/EditGroupForm.tsx
    - src/features/groups/ui/GroupStudentsTable.tsx
    - src/app/(dashboard)/groups/page.tsx
    - src/app/(dashboard)/groups/[groupId]/page.tsx
    - src/app/(dashboard)/my-group/page.tsx

key-decisions:
  - "Уровни на странице группы: prisma.level.findMany по subjectId с steps — getLevels не включает steps для mapUsersToDetails"
  - "groupId/subjectId на GroupStudentsTable — optional props для plan 11-03"

patterns-established:
  - "Enrollment mapping: levelId/groupId из enrollment, не из Student"
  - "studentCount из _count.enrollments в списке групп"

requirements-completed: [SUBJ-05, SUBJ-07]

coverage:
  - id: D1
    description: createGroup требует subjectId; updateGroup не меняет предмет
    requirement: SUBJ-07
    verification:
      - kind: unit
        ref: src/features/groups/actions/group-actions.test.ts#createGroup rejects missing subjectId
        status: pass
      - kind: unit
        ref: src/features/groups/actions/group-actions.test.ts#updateGroup ignores subjectId
        status: pass
    human_judgment: false
  - id: D2
    description: UI — обязательный предмет при создании, read-only при редактировании, колонка и фильтр
    requirement: SUBJ-05
    verification:
      - kind: unit
        ref: "scoped tsc: features/groups, groups/, my-group paths"
        status: pass
    human_judgment: true
    rationale: Визуальная проверка форм и фильтра Ant Design Table
  - id: D3
    description: E2E scaffold subject create/edit/filter
    requirement: SUBJ-05
    verification:
      - kind: e2e
        ref: e2e/groups-enrollment.spec.ts
        status: unknown
    human_judgment: true
    rationale: Playwright не запустился — TypeError в playwright.config.ts (окружение Node/Playwright)

duration: 18min
completed: 2026-07-07
status: complete
---

# Phase 11 Plan 02: Groups CRUD + Subject UI Summary

**Группы привязаны к предметам в CRUD и UI: обязательный subjectId при создании, read-only при редактировании, список с колонкой и фильтром; getGroup/getMyGroup на enrollments**

## Performance

- **Duration:** 18 min
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `group-actions`: `createGroupSchema`/`updateGroupSchema` из validations; `getGroups` с subject и `_count.enrollments`; `getGroup`/`getMyGroup` через enrollments
- Unit-тесты (6) зелёные: T-11-04, D-07, enrollment shape
- UI: `CreateGroupForm` с Select предмета; `EditGroupForm` read-only предмет; `GroupsList` колонка «Предмет» + фильтр
- Страницы `[groupId]` и `my-group` маппят учеников через enrollment.student/level
- E2E scaffold `groups-enrollment.spec.ts` (4 сценария)

## Task Commits

1. **Task 1: group-actions с subjectId, enrollments и unit-тесты** - `cd59654` (feat)
2. **Task 2: Формы, список и страницы на enrollment shape** - `953b38a` (feat)
3. **Task 3: E2E scaffold** - `982ecf4` (test)

## Files Created/Modified

- `src/features/groups/actions/group-actions.ts` — CRUD с subjectId, enrollments queries
- `src/features/groups/actions/group-actions.test.ts` — Vitest Wave 0
- `src/features/groups/ui/*` — формы, список, optional groupId/subjectId props
- `src/app/(dashboard)/groups/**` — getSubjects, enrollment mapping
- `src/app/(dashboard)/my-group/page.tsx` — teacher view через enrollments
- `e2e/groups-enrollment.spec.ts` — SUBJ-05/SUBJ-07 scaffold

## Decisions Made

- Уровни для `mapUsersToDetails`: `prisma.level.findMany({ subjectId, include steps })` вместо `getLevels` (нет steps в ответе)
- `GroupStudentsTable.groupId`/`subjectId` — подготовка к 11-03, пока не используются в рендере

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Уровни через prisma вместо getLevels на [groupId]/page**
- **Found during:** Task 2
- **Issue:** `getLevels(subjectId)` возвращает `_count.steps`, но не массив `steps` для `mapUsersToDetails`
- **Fix:** `prisma.level.findMany` с `include: { steps }` по `group.subjectId`
- **Files modified:** `src/app/(dashboard)/groups/[groupId]/page.tsx`
- **Committed in:** `953b38a`

## Issues Encountered

- E2E verify: `pnpm test:e2e e2e/groups-enrollment.spec.ts` падает с `TypeError: context.conditions?.includes is not a function` при загрузке `playwright.config.ts` — проблема окружения Node/Playwright, не кода spec. Spec создан и закоммичен; прогон — после починки окружения.

## Known Stubs

- `GroupStudentsTable.groupId`/`subjectId` — props принимаются, кнопка зачисления в plan 11-03

## Next Phase Readiness

- Готово для 11-03: enrollStudent/unenrollStudent + UI зачисления на `GroupStudentsTable`
- Full repo tsc остаётся в 11-04 (journal/user-admin)

## Self-Check: PASSED

- FOUND: src/features/groups/actions/group-actions.test.ts
- FOUND: e2e/groups-enrollment.spec.ts
- FOUND: .planning/phases/11-groups-enrollment/11-02-SUMMARY.md
- FOUND: cd59654, 953b38a, 982ecf4

---
*Phase: 11-groups-enrollment*
*Completed: 2026-07-07*
