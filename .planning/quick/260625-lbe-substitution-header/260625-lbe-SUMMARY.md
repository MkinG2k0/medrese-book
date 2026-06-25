# Quick Task 260625-lbe: Замещение в хедере — Summary

**Completed:** 2026-06-25

## Что сделано

- Добавлен `getActiveSubstitutionsForAbsentTeacher` для поиска активных замещений отсутствующего учителя
- Серверная функция `getSubstitutionHeaderInfo` формирует текст баннера по сессии:
  - Отсутствующий учитель: «Вас замещает {имя} до {дата}»
  - Замещающий (свой аккаунт): «Замещаете {имя} до {дата}»
  - Замещающий (переключён на учителя): «Замещаете {имя} до {дата}»
- Компонент `SubstitutionHeaderInfo` в хедере AppShell (слева на desktop, под ролью на mobile)

## Файлы

- `src/shared/lib/substitution-access.ts`
- `src/features/auth/lib/get-substitution-header-info.ts`
- `src/features/auth/ui/SubstitutionHeaderInfo.tsx`
- `src/widgets/app-shell/ui/AppShell.tsx`
- `src/app/(dashboard)/layout.tsx`
