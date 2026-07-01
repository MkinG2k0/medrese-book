# Quick Task 260701-ppw: Кнопка переключения роли после входа за учителя

## Цель
После переключения менеджера на учителя кнопка смены роли (UserSwitcher) должна оставаться видимой и показывать полный список пользователей.

## Причина
`resolveSwitchAccess` для TEACHER с `switchOwnerId` проверяет только сценарий замещения (`isValidTeacherSwitchSession`), но не переключение от MANAGER/SUPER_ADMIN. `getSwitchableUsers` в этом случае возвращает только текущего учителя.

## Задачи

### Task 1: Расширить resolveSwitchAccess
**Файлы:** `src/features/auth/lib/resolve-switch-access.ts`
**Действие:** Если `switchOwnerId` указывает на MANAGER или SUPER_ADMIN — разрешить переключение с этим owner.
**Готово когда:** TEACHER после admin-switch получает `allowed: true`.

### Task 2: Расширить getSwitchableUsers
**Файлы:** `src/features/auth/actions/switch-user-actions.ts`
**Действие:** Для TEACHER с admin `switchOwnerId` возвращать тот же список, что для менеджера (без STUDENT).
**Готово когда:** Список содержит менеджера, учителей и можно вернуться обратно.
