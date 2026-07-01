---
status: complete
---

# Quick Task 260701-attendance-by-day — Summary

## Что сделано

- Добавлена агрегация `buildAttendanceByDay`: PRESENT и LATE считаются посещением, ABSENT — нет
- `TopEntry` расширен полями `attendedSessions` и `attendanceByDay`
- Таблица «Топ учеников»: колонка «Посещено» + колонки по дням месяца (число дня, подсказка с датой)
- Горизонтальная прокрутка таблицы при широком месяце

## Файлы

- `src/shared/lib/analytics-queries/build-attendance-by-day.ts` (новый)
- `src/shared/lib/analytics-queries/build-attendance-by-day.test.ts` (новый)
- `src/shared/lib/analytics-queries/top-students.ts`
- `src/shared/lib/analytics.ts`
- `src/features/analytics/ui/TopStudents.tsx`
- `src/app/(dashboard)/analytics/page.tsx`
- `e2e/analytics-student-history.spec.ts`

## Проверка

- `pnpm test:unit src/shared/lib/analytics-queries/build-attendance-by-day.test.ts` — 2/2 passed
