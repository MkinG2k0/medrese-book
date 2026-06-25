# Quick Task 260625-m6v: Адаптация под мобильные — Summary

**Status:** complete  
**Commit:** baeab63

## Что сделано

### Навигация (AppShell)
- Хук `useIsMobile()` на базе `Grid.useBreakpoint()` (< 768px)
- На мобилке: боковой Sider скрыт, меню в `Drawer` по кнопке ☰
- Компактный header: усечённое имя, роль скрыта на xs
- Меньшие отступы контента на узких экранах

### Сообщения
- Master-detail: список ИЛИ чат на всю ширину
- Кнопка «Назад» в заголовке чата

### Прочее
- `viewport`: `device-width`, `initialScale: 1`
- Горизонтальный скролл `JournalStudentsTable`

## Файлы

- `src/shared/lib/use-breakpoint.ts` (новый)
- `src/widgets/app-shell/ui/AppShell.tsx`
- `src/features/messaging/ui/MessagesPage.tsx`
- `src/features/messaging/ui/ChatPanel.tsx`
- `src/features/journal/ui/JournalStudentsTable.tsx`
- `src/app/layout.tsx`

## Проверка

- `pnpm exec tsc --noEmit` — OK
- Ручная проверка: DevTools → responsive < 768px, меню, сообщения, журнал

## Не в scope

- Горизонтальный скролл всех админ-таблиц
- Отдельная bottom navigation bar
- E2E-тесты мобильного layout
