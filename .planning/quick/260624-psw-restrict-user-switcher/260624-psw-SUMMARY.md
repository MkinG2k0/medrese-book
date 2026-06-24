# Quick Task 260624-psw — Summary

**Задача:** Убрать переключение между ролями для всех кроме менеджера и супер-админа; исключить учеников из списка.

**Commit:** ee3858c

## Изменения

### `src/features/auth/lib/can-switch-user.ts`
- Удалён обход `NODE_ENV === 'development'` — переключение доступно только `SUPER_ADMIN` и `MANAGER`

### `src/features/auth/actions/switch-user-actions.ts`
- `getSwitchableUsers`: фильтр `role: { not: 'STUDENT' }`
- `switchUser`: защита от прямого вызова на ученика

## Результат
- Учитель и ученик не видят UserSwitcher в сайдбаре
- Менеджер/админ видят список без учеников (админ, менеджер, учителя)
