---
quick_id: 260923-v2l
slug: zhurnal-ubrat-dop-zadaniya-iz-zhurnala-u
status: in-progress
---

# Quick: доп. задания в журнале

## Goal

1. Убрать доп. задания из журнала урока (кнопка, карточки, назначение).
2. Убрать оценку у доп. заданий (UI истории / карточки).
3. Закрыть редкий баг «+1 шаг» при работе с доп. заданием: `ensureSession` сохранял черновые оценки шагов → `recalculateStudentStepIdx`.

## Tasks

- [x] Strip journal UI/hooks for assign/grade/display of extras
- [x] Remove grade columns from student/analytics history
- [x] Ensure no journal path persists step grades via extra-assign flow
- [x] Update e2e / help text that mention journal assign+grade
