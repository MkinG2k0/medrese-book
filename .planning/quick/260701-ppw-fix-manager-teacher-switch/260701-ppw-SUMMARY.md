---
status: complete
---

# Quick Task 260701-ppw — Summary

**Задача:** После переключения менеджера на учителя исчезала кнопка смены роли.

**Commit:** 36ced6b

## Причина

При admin-switch в JWT сохраняется `switchOwnerId` менеджера (см. `auth.ts`). Но `resolveSwitchAccess` для роли TEACHER проверял только сценарий замещения (`isValidTeacherSwitchSession`), а `getSwitchableUsers` возвращал только текущего учителя.

## Изменения

### `src/features/auth/lib/resolve-switch-access.ts`
- Добавлена `isPrivilegedSwitchOwner()` — owner с ролью MANAGER/SUPER_ADMIN
- TEACHER с `switchOwnerId` от привилегированного owner получает `allowed: true`

### `src/features/auth/actions/switch-user-actions.ts`
- Для TEACHER с admin `switchOwnerId` возвращается полный список (без STUDENT), как у менеджера
- Вынесен `getPrivilegedSwitchableUsers()` для переиспользования

## Результат
- Менеджер → учитель: кнопка переключения остаётся, можно вернуться к менеджеру или выбрать другого пользователя
- Сценарий замещения учителей не затронут
