---
status: complete
---

# Quick Task 260701-pj3 — Summary

## Что сделано

- Добавлен `shouldShowOnlyCompletedLessonSteps`: режим «только пройденные» для прошлых дат и для дня с завершённым teaching session (`endedAt`)
- `useLessonPage` фильтрует шаги по completions сессии в этом режиме; скрыты «Загрузить ещё» и переход на следующий уровень
- `groupId` проброшен с сервера на страницу урока для запроса статуса teaching session

## Файлы

- `src/features/journal/lib/lesson-view-mode.ts` (новый)
- `src/features/journal/lib/lesson-view-mode.test.ts` (новый)
- `src/features/journal/model/use-lesson-page.ts`
- `src/features/journal/lib/lesson-types.ts`
- `src/features/journal/actions/journal-actions.ts`
- `src/app/(dashboard)/journal/[studentId]/page.tsx`

## Проверка

- `pnpm test:unit src/features/journal/lib/lesson-view-mode.test.ts` — 3/3 passed
