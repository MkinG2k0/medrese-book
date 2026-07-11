---
phase: 11-groups-enrollment
plan: 06
subsystem: admin
tags: [user-admin, student-admin, GroupEnrollment, D-02]

requires:
  - phase: 11-groups-enrollment
    provides: GroupEnrollment model and enrollment actions (plans 11-01, 11-03)
provides:
  - createUsers with GroupEnrollment branch
  - Read-only group/level in UserDetailModal per D-02
  - CreateUserForm cascade levels by group.subjectId
  - student-admin progress via enrollment
affects: [admin/users, groups, journal, student progress edit]

tech-stack:
  added: []
  patterns:
    - "createUsers: student.create без groupId/levelId + groupEnrollment.create в transaction"
    - "updateStudentUser: профиль без groupId/levelId (D-02)"
    - "CreateUserForm: getLevelsWithStepsForSubject после выбора группы"
    - "findPrimaryEnrollment для progress edit и authorize"

key-files:
  created:
    - src/shared/lib/enrollment.ts
  modified:
    - src/features/user-admin/actions/user-actions.ts
    - src/shared/lib/validations/user.ts
    - src/features/user-admin/lib/map-users-to-details.ts
    - src/features/user-admin/ui/CreateUserForm.tsx
    - src/features/user-admin/ui/UserDetailModal.tsx
    - src/features/user-admin/ui/UsersTable.tsx
    - src/features/student-admin/actions/student-admin-actions.ts
    - src/shared/lib/authorize-student-access.ts
    - src/app/(dashboard)/admin/users/page.tsx
    - src/app/(dashboard)/groups/[groupId]/page.tsx
    - src/app/(dashboard)/my-group/page.tsx
    - e2e/admin.spec.ts

key-decisions:
  - "D-02: groupId/levelId убраны из updateStudentUserSchema; зачисление только на /groups/[groupId]"
  - "UsersTable groupName: «N групп» при 3+ зачислениях"
  - "Progress edit использует findPrimaryEnrollment (первая по enrolledAt) — tech debt до Phase 12"

patterns-established:
  - "Admin create student: verify level.subjectId === group.subjectId перед enrollment"
  - "mapUsersToDetails: levelId/groupId из primary enrollment"

requirements-completed: [SUBJ-06]

coverage:
  - id: D1
    description: "createUsers создаёт Student без groupId/levelId и GroupEnrollment"
    requirement: SUBJ-06
    verification:
      - kind: other
        ref: "scoped tsc user-admin paths"
        status: pass
    human_judgment: false
  - id: D2
    description: "UserDetailModal read-only group/level для STUDENT"
    requirement: SUBJ-06
    verification:
      - kind: other
        ref: "scoped tsc user-admin paths"
        status: pass
    human_judgment: false
  - id: D3
    description: "CreateUserForm каскадирует уровни по group.subjectId"
    requirement: SUBJ-06
    verification:
      - kind: other
        ref: "scoped tsc user-admin paths"
        status: pass
    human_judgment: false
  - id: D4
    description: "student-admin progress через enrollment.levelId"
    requirement: SUBJ-06
    verification:
      - kind: other
        ref: "scoped tsc student-admin paths"
        status: pass
    human_judgment: false
  - id: D5
    description: "Admin E2E green"
    requirement: SUBJ-06
    verification:
      - kind: e2e
        ref: "pnpm test:e2e e2e/admin.spec.ts"
        status: blocked
    human_judgment: true

duration: 35min
completed: 2026-07-11
status: complete
---

# Phase 11 Plan 06: User-Admin & Student-Admin Adapter Summary

**Admin-потоки переведены на GroupEnrollment: создание с зачислением, read-only группа/уровень в модалке, каскад уровней по предмету группы**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3 (E2E blocked by Playwright config)
- **Files modified:** 12

## Accomplishments

- `createUsers`: Student без `groupId`/`levelId`, `groupEnrollment.create` с проверкой `level.subjectId === group.subjectId`
- `updateStudentUser` / `UserDetailModal`: убраны `groupId`/`levelId` из схем и формы (D-02); группы отображаются read-only
- `CreateUserForm`: уровни загружаются через `getLevelsWithStepsForSubject` после выбора группы
- `mapUsersToDetails`: `levelId`/`groupName` из enrollments; «N групп» при нескольких зачислениях
- `student-admin-actions`: `getStudentProgressEdit` / `updateStudentProgress` через `findPrimaryEnrollment`; обновление `enrollment.levelId`
- `admin/users/page.tsx`: группы с `subjectId`, без `getLevelsForCreateUser`
- `e2e/admin.spec.ts`: ожидание загрузки уровня + проверка ученика в составе группы

## Task Commits

1. **Task 1–3: user-admin + student-admin adapter + E2E update** — (this commit)

## Verification

- Scoped tsc Tasks 1–2: **PASS** (`.tsc-11-06-t1.out`, `.tsc-11-06-t2.out`)
- Full repo tsc: deferred to plan 11-04 Task 4
- E2E `admin.spec.ts`: **BLOCKED** — `TypeError: context.conditions?.includes is not a function` в `playwright.config.ts` (инфраструктурная ошибка, не связана с изменениями 11-06)

## Deviations from Plan

### Blocked verification

**E2E admin.spec.ts не запущен**
- **Issue:** Playwright config падает при загрузке (`context.conditions?.includes is not a function`)
- **Impact:** Тесты обновлены, но автоматическая верификация не выполнена
- **Mitigation:** Scoped tsc green; ручная проверка create student → visible in group

### Minor scope

- `students/[studentId]/edit/page.tsx` не изменён — достаточно обновления `getStudentProgressEdit` (enrollment-based data)
- Добавлен `src/shared/lib/enrollment.ts` (`findPrimaryEnrollment`) — shared helper для authorize и student-admin

## Known Limitations (Phase 12 tech debt)

- Глобальный `currentStepIdx` на Student; progress edit использует primary enrollment
- Смена levelId существующего зачисления вне страницы группы — только через enroll flow

## Self-Check: PASSED (scoped)

- FOUND: user-actions.ts enrollment branch
- FOUND: UserDetailModal read-only groups
- FOUND: CreateUserForm cascade
- FOUND: student-admin-actions enrollment update
- E2E: blocked (infra)

---
*Phase: 11-groups-enrollment*
*Completed: 2026-07-11*
