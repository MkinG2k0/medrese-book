---
status: resolved
trigger: при смене шага через моя группа на проде такая ошибка
created: 2026-04-08
updated: 2026-04-08
---

# Debug: my-group step change → «Ученик не найден»

## Symptoms

- **Expected:** Учитель меняет «Текущий шаг» в модалке ученика на `/my-group` и сохраняет без ошибки.
- **Actual:** Красный баннер Next.js Server Components + digest `4248366582`.
- **Errors:** Prod logs: `Error: Ученик не найден`. Network: Server Action payload `["<studentId>", { "status": "ACTIVE" }]`.
- **Timeline:** На проде при смене шага через «Моя группа».
- **Reproduction:** Моя группа → открыть ученика → сменить шаг → Сохранить.

## Current Focus

- **hypothesis:** `updateStudentStatus` вызывается без `groupId` и авторизует через `findPrimaryEnrollment`; у учителя проверка `teacherId` падает, если primary enrollment в другой группе → throw «Ученик не найден». Смена шага через `updateStudentProgress` с `groupId` уже ок; падает второй вызов.
- **test:** Передать `groupId` в `updateStudentStatus` / схему; в `UserDetailModal` передавать `resolvedGroupId`.
- **expecting:** Сохранение шага с `/my-group` не бросает «Ученик не найден».
- **next_action:** Apply fix in student-status schema, student-admin-actions, UserDetailModal

## Evidence

- timestamp: 2026-04-08
  - observation: Prod payload is `updateStudentStatus(id, { status: "ACTIVE" })`, not progress payload
  - source: browser network tab screenshot
- timestamp: 2026-04-08
  - observation: `UserDetailModal.handleProgressAndStatusSubmit` calls progress WITH groupId, then status WITHOUT groupId
  - source: `src/features/user-admin/ui/UserDetailModal.tsx`
- timestamp: 2026-04-08
  - observation: `requireStudentEditAccess(studentId)` without groupId uses `findPrimaryEnrollment`; teacher mismatch returns null student → throw
  - source: `authorize-student-access.ts`, `student-admin-actions.ts:153-155`

## Eliminated

(none yet)

## Resolution

- root_cause: `updateStudentStatus` авторизовал через `findPrimaryEnrollment` без `groupId`. После успешного `updateStudentProgress(groupId)` второй вызов падал для учеников, у которых primary enrollment не в группе текущего учителя (или teacher mismatch).
- fix: optional `groupId` в `updateStudentStatusSchema`; `requireStudentEditAccess(studentId, groupId)`; `UserDetailModal` передаёт `resolvedGroupId`.
- verification: code path matches prod payload; deploy needed for prod confirm
- files_changed:
  - src/shared/lib/validations/student-status.ts
  - src/features/student-admin/actions/student-admin-actions.ts
  - src/features/user-admin/ui/UserDetailModal.tsx
