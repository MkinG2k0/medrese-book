# Quick Task 260624-psw: Ограничить переключение пользователей

## Цель
- Переключение ролей доступно только менеджеру и супер-админу (убрать dev-обход)
- Из списка переключения исключить учеников

## Задачи

### Task 1: Ограничить canSwitchUser
**Файлы:** `src/features/auth/lib/can-switch-user.ts`
**Действие:** Убрать `process.env.NODE_ENV === 'development'` — только SUPER_ADMIN и MANAGER
**Проверка:** Учитель не видит UserSwitcher в сайдбаре
**Готово когда:** canSwitchUser возвращает true только для SUPER_ADMIN и MANAGER

### Task 2: Исключить учеников из списка и switchUser
**Файлы:** `src/features/auth/actions/switch-user-actions.ts`
**Действие:** 
- В getSwitchableUsers добавить `where: { role: { not: 'STUDENT' } }`
- В switchUser проверять, что целевой пользователь не STUDENT
**Проверка:** Список не содержит учеников; switchUser на ученика выбрасывает ошибку
**Готово когда:** Запрос и action защищены от переключения на ученика
