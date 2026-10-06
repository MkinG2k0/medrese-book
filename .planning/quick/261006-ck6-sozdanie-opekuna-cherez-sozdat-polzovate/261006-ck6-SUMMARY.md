---
quick_id: 261006-ck6
slug: sozdanie-opekuna-cherez-sozdat-polzovate
phase: 261006-ck6
plan: 01
subsystem: user-admin
tags: [parent, users, create-user]
status: complete
date: 2026-10-06
taiga_url:

requires: []
provides:
  - PARENT role in CreateUserForm
  - Optional student attachment on guardian create
affects: [user-admin]

key-files:
  created: []
  modified:
    - src/shared/lib/validations/user.ts
    - src/shared/lib/validations/user-parent.test.ts
    - src/features/user-admin/actions/user-actions.ts
    - src/features/user-admin/ui/CreateUserForm.tsx
    - e2e/admin.spec.ts
---

# Summary

В «Создать пользователя» добавлена роль «Опекун». Можно сразу (необязательно) выбрать существующих учеников — они привязываются к новому опекуну.

## What was done

- Схема и payload: `studentIds` только для одного `PARENT`
- `searchStudentsForParent` + привязка в `createUsers` (`parentId`, `guardianName`, `guardianPhone`)
- Форма: роль «Опекун», телефон, мультивыбор учеников
- Unit-тесты payload/схемы; e2e-сценарий создания с прикреплением

## Verification

- `pnpm test:unit -- src/shared/lib/validations/user-parent.test.ts` — 7 passed
- Browser: роль «Опекун», поля ФИО/телефон, «Ученики» с подсказкой «Необязательно», список учеников с группами
- Playwright CLI в этой среде падает на загрузке `playwright.config.ts` (`context.conditions?.includes is not a function`) — не связано с правками

## Follow-ups

- Прикрепить учеников можно только при создании одного опекуна (несколько имён — поле учеников disabled)
