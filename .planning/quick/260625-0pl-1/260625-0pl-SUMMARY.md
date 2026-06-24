# Quick Task 260625-0pl — Summary

**Task:** Разлогинить ТОЛЬКО преподавателя при неактивности в 1 час  
**Date:** 2026-06-24  
**Status:** complete

## Что сделано

1. Добавлена зависимость `react-idle-timer@5.7.3`.
2. Создан `IdleSessionGuard` — отслеживает бездействие только для роли `TEACHER` (1 час), вызывает `signOut` с `?reason=idle`.
3. Guard подключён в `AppShell` для всех dashboard-страниц.
4. На странице входа показывается сообщение «Сессия завершена из-за неактивности» при `reason=idle`.
5. Unit-тесты для `isTeacherIdleLogoutEnabled` и константы таймаута.
6. E2E-сценарии для учителя (logout после 1ч) и менеджера (без logout) — добавлены в `e2e/auth.spec.ts`.

## Файлы

- `src/features/auth/lib/idle-session.ts`
- `src/features/auth/lib/idle-session.test.ts`
- `src/features/auth/ui/IdleSessionGuard.tsx`
- `src/widgets/app-shell/ui/AppShell.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/features/auth/ui/LoginForm.tsx`
- `e2e/auth.spec.ts`
- `package.json`, `pnpm-lock.yaml`

## Проверка

- `pnpm vitest run src/features/auth/lib/idle-session.test.ts` — passed
- E2E не запускались локально (ошибка подключения к БД в global-setup)

## Примечания

- Менеджеры, админы и ученики не затрагиваются — guard отключён для всех ролей кроме `TEACHER`.
- Серверный `session.maxAge` не менялся глобально, чтобы не ограничивать другие роли.
