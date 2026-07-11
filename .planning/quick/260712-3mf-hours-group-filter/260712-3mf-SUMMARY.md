---
status: complete
---

# Quick Task 260712-3mf — Summary

## Что сделано

- Таблица «Мои часы» / «Аналитика учителей» показывает колонку **Группа**
- Строки строятся по паре учитель + группа (уроки — по `TeachingSession.groupId`, приход/уход — общие для учителя)
- Фильтр **Все группы** / конкретная группа через `groupId` в URL (`TeacherLessonsGroupPicker`)
- Редактирование времени урока привязано к `groupId`

## Файлы

- `src/features/analytics/lib/teacher-lessons-analytics.ts`
- `src/features/analytics/actions/teacher-lessons-actions.ts`
- `src/features/analytics/ui/TeacherLessonsAnalytics.tsx`
- `src/features/analytics/ui/TeacherLessonsDateFilter.tsx`
- `src/features/analytics/ui/EditableTeacherTimeCell.tsx`
- `src/features/accounting/ui/MySalaryPage.tsx`
- `src/app/(dashboard)/accounting/my-salary/page.tsx`
- `src/app/(dashboard)/analytics/teachers/page.tsx`
- `src/shared/lib/validations/teacher-lesson-time.ts`

## Проверка

- `vitest run src/features/analytics/lib/teacher-lessons-analytics.test.ts` — 3 passed
- `tsc --noEmit` — ok
