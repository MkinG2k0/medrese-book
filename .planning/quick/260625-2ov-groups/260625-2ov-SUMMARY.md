# Quick Task 260625-2ov: добавь кнопку создать группу в /groups

**Completed:** 2026-06-24
**Commit:** c3ed60c

## Summary

На странице `/groups` добавлена кнопка «Создать группу» справа от заголовка. Кнопка ведёт на `/admin/groups` с формой создания группы.

## Changes

- `src/features/groups/ui/GroupsList.tsx` — заголовок с кнопкой по паттерну страницы «Программа обучения»

## Verification

- Кнопка отображается на `/groups`
- Клик ведёт на `/admin/groups`
