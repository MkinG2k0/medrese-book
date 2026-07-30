# Task 7 Report: Бейджи в колонке «Пропуски»

## Сделано

1. **`AtRiskStudentsTable.tsx`** — колонка «Пропуски» рендерит:
   - `"0"` — если нет пропусков;
   - красный `Tag` — неуважительные (`absencesInMonth > 0`);
   - золотой `Tag` — уважительные (`excusedAbsencesInMonth > 0`);
   - оба тега в `flex flex-wrap gap-1`, если есть оба типа.

2. **`AtRiskStudentApiRow`** — добавлено поле `excusedAbsencesInMonth: number` для соответствия API.

## Файлы

- `src/features/analytics/ui/AtRiskStudentsTable.tsx`
- `src/entities/student-metrics/model/types.ts`

## Проверка

- `pnpm exec tsc --noEmit` — OK

## Коммит

Не выполнялся (по инструкции).
