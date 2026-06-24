# Quick Task 260625-1jf — Summary

**Task:** Страница «Аналитика учителей» для менеджера и супер-админа  
**Date:** 2026-06-24  
**Status:** complete

## Что сделано

1. Страница `/analytics/teachers` с таблицей: учитель, вход, начало/конец урока, длительность.
2. Фильтр: один день или диапазон (`RangePicker`); для диапазона — средние значения времени и длительности.
3. Данные: `TeachingSession` + `AuditEvent` (`USER_LOGIN`).
4. Пункт меню «Аналитика учителей» только для `MANAGER` / `SUPER_ADMIN`.
5. Unit-тесты агрегации, e2e доступа по ролям.

## Файлы

- `src/app/(dashboard)/analytics/teachers/page.tsx`
- `src/features/analytics/actions/teacher-lessons-actions.ts`
- `src/features/analytics/lib/teacher-lessons-analytics.ts`
- `src/features/analytics/ui/TeacherLessonsAnalytics.tsx`
- `src/features/analytics/ui/TeacherLessonsDateFilter.tsx`
- `e2e/teacher-analytics.spec.ts`
