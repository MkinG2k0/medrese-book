# Quick Task 260606-v2w — Summary

## Что сделано

- **lib/** — константы, типы, `buildInitialStepStates`, `buildCumulativeHoursMap`, маппинг шагов сессии
- **model/use-lesson-page.ts** — вся клиентская логика (сессия, видимость, сохранение)
- **ui/lesson/** — `LessonPageHeader`, `LessonStepsSection`, `LessonSaveBar`, `LevelProgramDivider`
- **LessonPage.tsx** — композиция компонентов (~60 строк вместо ~594)

## Проверка

- `pnpm exec tsc --noEmit` — OK

## Поведение

Без изменений: загрузка сессии, оценки, «Загрузить ещё», переход к следующему ученику.
