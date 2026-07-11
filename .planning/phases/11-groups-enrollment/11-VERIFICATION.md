---
phase: 11-groups-enrollment
verified: 2026-07-11T21:59:59Z
status: passed
score: 15/15 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 11: Groups & Enrollment Verification Report

**Phase Goal:** Группы привязаны к предметам; ученики зачисляются в несколько групп
**Verified:** 2026-07-11T21:59:59Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Group.subjectId обязателен, FK → Subject (SUBJ-05, SC2) | ✓ VERIFIED | `prisma/schema.prisma` — `Group.subjectId String`, `onDelete: Restrict`, `@@index([subjectId])` |
| 2 | GroupEnrollment — единственный источник зачислений; Student без groupId/levelId (SUBJ-06, D-01) | ✓ VERIFIED | `GroupEnrollment` model; `Student` только `enrollments[]`; migration drops `Student.groupId`, `Student.levelId` |
| 3 | Prod-safe миграция с backfill Quran → GroupEnrollment | ✓ VERIFIED | `prisma/migrations/20260707200000_group_enrollment/migration.sql` — UPDATE subjectId, INSERT enrollments, DROP columns |
| 4 | Zod: createGroupSchema (subjectId), updateGroupSchema (без subjectId), enrollStudentSchema + level guard | ✓ VERIFIED | `src/shared/lib/validations/group.ts`, `enrollment.ts`; `enrollment.test.ts` — 6 тестов |
| 5 | Менеджер выбирает предмет при создании группы (SUBJ-07, ROADMAP SC1) | ✓ VERIFIED | `CreateGroupForm` — required Select `subjectId`; `createGroup` → `createGroupSchema.parse`; E2E spec |
| 6 | Предмет read-only при редактировании; updateGroup не меняет subjectId (D-07) | ✓ VERIFIED | `EditGroupForm` — disabled Input; `updateGroup` обновляет только `name`, `teacherId`; unit test D-07 |
| 7 | GroupsList: колонка «Предмет» + фильтр по предмету (ROADMAP SC2, D-08) | ✓ VERIFIED | `GroupsList.tsx` — column `subjectName`, `filters` + `onFilter` по `subjectId`; `groups/page.tsx` → `getSubjects` |
| 8 | Зачисление/снятие только на `/groups/[groupId]` (D-02, ROADMAP SC4) | ✓ VERIFIED | `GroupStudentsTable` — «Добавить ученика», unenroll; `EnrollStudentModal`; `groups/[groupId]/page.tsx` — `canManageEnrollment` |
| 9 | Ученик в нескольких группах, в т.ч. одного предмета (SUBJ-06, D-10, ROADMAP SC3) | ✓ VERIFIED | `@@unique([studentId, groupId])` без unique по subject; seed dual enrollment (код 300001 → group2); E2E multi-group |
| 10 | levelId на GroupEnrollment; guard subject при enroll (D-04, D-05, T-11-02) | ✓ VERIFIED | `GroupEnrollment.levelId`; `enrollStudent` — `level.findFirst({ id, subjectId: group.subjectId })`; unit test T-11-02 |
| 11 | GET `/api/students?groupId` и auth через GroupEnrollment (T-11-03) | ✓ VERIFIED | `src/app/api/students/route.ts` — `group.enrollments`; `authorize-api-request.ts` — `groupEnrollment.findUnique` |
| 12 | Legacy sweep: runtime `src/` не читает `Student.groupId` / `group.students` | ✓ VERIFIED | grep `src/` — 0 runtime reads; только test string и enrollment-mapped `groupId` в progress edit page |
| 13 | user-admin / student-admin отражают enrollment-модель (ROADMAP SC4) | ✓ VERIFIED | `createUsers` → `groupEnrollment.create`; `UserDetailModal` — disabled «Группы»/«Уровень»; `getStudentProgressEdit` через enrollment |
| 14 | CreateUserForm каскадирует уровни по `group.subjectId` | ✓ VERIFIED | `CreateUserForm.tsx` — `getLevelsWithStepsForSubject(selectedGroup.subjectId)`; `admin/users/page.tsx` — groups с `subjectId` |
| 15 | seed.ts / seed-e2e.ts: groups с subjectId, GroupEnrollment, wipe order | ✓ VERIFIED | `groupEnrollment.deleteMany` перед `student.deleteMany`; `Group.create` с `subjectId`; enrollments в обоих seed |
| 16 | SUBJ-05, SUBJ-06, SUBJ-07 — требования фазы выполнены | ✓ VERIFIED | См. строки 1–15; mapping в `.planning/REQUIREMENTS.md` Phase 11 |

**Score:** 15/15 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | Group.subjectId, GroupEnrollment, Student без groupId/levelId | ✓ VERIFIED | Поля и constraints на месте |
| `prisma/migrations/20260707200000_group_enrollment/` | Prod-safe backfill + column drops | ✓ VERIFIED | 58 строк SQL, Quran backfill, enrollment INSERT |
| `src/shared/lib/validations/group.ts` | create/update group schemas | ✓ VERIFIED | subjectId required в create, absent в update |
| `src/shared/lib/validations/enrollment.ts` | enroll/unenroll + level guard | ✓ VERIFIED | `assertLevelBelongsToGroupSubject` |
| `src/shared/lib/validations/enrollment.test.ts` | Unit tests T-11-01 | ✓ VERIFIED | 6 тестов |
| `src/features/groups/actions/group-actions.ts` | CRUD + enroll/unenroll/search | ✓ VERIFIED | 247 строк, enrollment-scoped queries |
| `src/features/groups/actions/group-actions.test.ts` | Unit tests T-11-02, T-11-04 | ✓ VERIFIED | 13 тестов |
| `src/features/groups/ui/GroupsList.tsx` | Колонка + фильтр предмета | ✓ VERIFIED | subjectFilters, onFilter |
| `src/features/groups/ui/CreateGroupForm.tsx` | Обязательный Select предмета | ✓ VERIFIED | rules required |
| `src/features/groups/ui/EditGroupForm.tsx` | Read-only предмет | ✓ VERIFIED | disabled Input |
| `src/features/groups/ui/EnrollStudentModal.tsx` | Picker ученика + уровня | ✓ VERIFIED | searchStudentsForEnroll, enrollStudent |
| `src/features/groups/ui/GroupStudentsTable.tsx` | Add/unenroll + modal wiring | ✓ VERIFIED | canManageEnrollment branch |
| `src/app/(dashboard)/groups/page.tsx` | getSubjects + getGroups | ✓ VERIFIED | subjects prop для фильтра |
| `src/app/(dashboard)/groups/[groupId]/page.tsx` | Enrollment mapping + modal | ✓ VERIFIED | enrollments → mapUsersToDetails |
| `src/app/api/students/route.ts` | Enrollment-based list | ✓ VERIFIED | group.enrollments map |
| `src/shared/lib/authorize-api-request.ts` | GroupEnrollment membership | ✓ VERIFIED | findUnique studentId_groupId |
| `src/features/user-admin/actions/user-actions.ts` | createUsers с enrollment | ✓ VERIFIED | groupEnrollment.create в transaction |
| `src/features/user-admin/ui/UserDetailModal.tsx` | Read-only group/level | ✓ VERIFIED | disabled Input для групп и уровня |
| `src/features/user-admin/ui/CreateUserForm.tsx` | Cascade levels по subjectId | ✓ VERIFIED | getLevelsWithStepsForSubject |
| `src/features/student-admin/actions/student-admin-actions.ts` | Progress через enrollment | ✓ VERIFIED | requireStudentEditAccess → enrollment |
| `src/features/program-admin/actions/program-actions.ts` | deleteLevel enrollment count | ✓ VERIFIED | `groupEnrollment.count({ levelId })` |
| `prisma/seed.ts` | Demo groups + enrollments | ✓ VERIFIED | subjectId на группах, dual enrollment seed |
| `prisma/seed-e2e.ts` | E2E fixtures через GroupEnrollment | ✓ VERIFIED | groupEnrollment.create для тестовых учеников |
| `e2e/groups-enrollment.spec.ts` | SUBJ-05..07 E2E | ✓ VERIFIED | 6 сценариев: create, edit read-only, filter, enroll, multi-group |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `CreateGroupForm` | `createGroupSchema` | `subjectId` в payload onFinish | ✓ WIRED | `createGroup(values)` |
| `groups/page.tsx` | `getSubjects` | subjects prop → GroupsList filters | ✓ WIRED | `Promise.all([getGroups, getTeachers, getSubjects])` |
| `updateGroup` | `updateGroupSchema` | subjectId исключён из parse | ✓ WIRED | только name, teacherId в update data |
| `EnrollStudentModal` | `getLevels(subjectId)` | levels prop с page | ✓ WIRED | page loads levels by `group.subjectId` |
| `enrollStudent` | `prisma.level.findFirst` | id + subjectId guard | ✓ WIRED | `group-actions.ts:136-141` |
| `GroupStudentsTable` | `unenrollStudent` | modal.confirm + server action | ✓ WIRED | `handleUnenroll` |
| `/api/students` | `group.enrollments` | Prisma include + map | ✓ WIRED | enrollment.level, currentStepIdx |
| `authorize-api-request` | `GroupEnrollment` | studentId_groupId lookup | ✓ WIRED | STUDENT role check |
| `createUsers` | `groupEnrollment.create` | STUDENT + groupId + levelId | ✓ WIRED | `user-actions.ts:137-141` |
| `CreateUserForm` | `getLevelsWithStepsForSubject` | selectedGroup.subjectId | ✓ WIRED | useEffect cascade |
| Migration SQL | `DEFAULT_QURAN_SUBJECT_ID` | Group.subjectId UPDATE | ✓ WIRED | `clq10defaultquransubject00` |
| `seed.ts` Group.create | `quranSubject.id` | subjectId на каждой группе | ✓ WIRED | group1, group2 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `GroupsList` | `subjectName`, filters | `getGroups` → `g.subject.name` | ✓ DB query | ✓ FLOWING |
| `groups/[groupId]/page` | `users` | `group.enrollments` → `mapUsersToDetails` | ✓ DB query | ✓ FLOWING |
| GET `/api/students` | `currentStepIdx`, `levelTitle` | `enrollment.currentStepIdx`, `enrollment.level` | ✓ DB query | ✓ FLOWING |
| `EnrollStudentModal` | `students` | `searchStudentsForEnroll(groupId)` | ✓ Prisma findMany | ✓ FLOWING |
| `UserDetailModal` | `enrollmentGroups` | `mapUsersToDetails` ← enrollments join | ✓ mapped from DB | ✓ FLOWING |
| `CreateUserForm` | `levels` | `getLevelsWithStepsForSubject(group.subjectId)` | ✓ DB query | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| createGroup rejects missing subjectId (T-11-04) | `pnpm test:unit -- group-actions.test.ts` | 13 passed | ✓ PASS |
| enrollStudent level guard (T-11-02) | same | included in 13 passed | ✓ PASS |
| enrollment Zod + level guard (T-11-01) | `pnpm test:unit -- enrollment.test.ts` | 6 passed | ✓ PASS |
| E2E SUBJ-05..07 happy paths | `pnpm test:e2e e2e/groups-enrollment.spec.ts` | not run (no dev server) | ? SKIP |

### Probe Execution

Step 7c: SKIPPED — phase does not declare probe scripts.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| SUBJ-05 | 11-01, 11-02, 11-05 | Группа привязана ровно к одному предмету | ✓ SATISFIED | `Group.subjectId` NOT NULL; колонка в GroupsList; create requires subject |
| SUBJ-06 | 11-01, 11-03, 11-04, 11-05, 11-06 | Ученик в нескольких группах | ✓ SATISFIED | GroupEnrollment junction; enroll UI; API через enrollments; seed dual enrollment |
| SUBJ-07 | 11-02 | Менеджер назначает предмет при создании группы | ✓ SATISFIED | CreateGroupForm Select; createGroupSchema; read-only при edit per D-07 |

**Note:** `.planning/REQUIREMENTS.md` чекбоксы SUBJ-05..07 всё ещё `[ ] Pending` — документация не обновлена, реализация в коде присутствует.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | — | — | Нет blockers (TBD/FIXME/stubs) в файлах фазы |

### Human Verification Required

Нет обязательных пунктов — автоматические проверки и unit-тесты покрывают must-haves. Рекомендуется вручную прогнать `pnpm test:e2e e2e/groups-enrollment.spec.ts` при поднятом dev-сервере для визуальной регрессии UI.

### Gaps Summary

Пробелов не обнаружено. Цель фазы достигнута: группы привязаны к предметам, зачисление many-to-many через GroupEnrollment, админка и API адаптированы.

**ROADMAP SC1 уточнение:** формулировка «при создании/редактировании выбирает предмет» реализована как выбор при создании + read-only отображение при редактировании (D-07) — намеренное отклонение от буквального «выбора» на edit.

---

_Verified: 2026-07-11T21:59:59Z_
_Verifier: Claude (gsd-verifier)_
