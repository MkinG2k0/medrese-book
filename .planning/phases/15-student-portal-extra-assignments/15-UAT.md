---
status: testing
phase: 15-student-portal-extra-assignments
source: [15-VERIFICATION.md]
started: 2026-07-11T23:10:00Z
updated: 2026-07-11T23:10:00Z
---

## Current Test

number: 1
name: Дашборд /student/me — карточки per enrollment
expected: |
  N карточек для N enrollments; на каждой — предмет, группа, уровень, ProgressBar, метрики месяца (Уроков/Шагов/Время обучения); две группы одного предмета дают две отдельные карточки
awaiting: user response

## Tests

### 1. Дашборд /student/me — карточки per enrollment
expected: N карточек для N enrollments; на каждой — предмет, группа, уровень, ProgressBar, метрики месяца; две группы одного предмета → две карточки
result: [pending]

### 2. Deep link + F5 — сохранение groupId
expected: Клик «Уроки» на карточке → URL с ?groupId=; F5 сохраняет контекст; localStorage содержит student-portal:lastGroupId
result: [pending]

### 3. Primary enrollment из меню
expected: Меню «Уроки» без groupId → открывается primary enrollment (первая группа по enrolledAt asc)
result: [pending]

### 4. Каталог допзаданий — фильтр по предмету
expected: Учитель → /extra-assignments → смена Select «Предмет» обновляет уровни/шаги и шаблоны; шаблоны другого предмета не видны
result: [pending]

### 5. Модалка назначения на уроке
expected: Модалка «Назначить доп. задание» показывает только шаблоны предмета группы; cross-step внутри предмета доступен
result: [pending]

### 6. История допзаданий ученика
expected: /student/extra-assignments — Collapse-секции по subject.name; таблица с датой, шагом, заданием, автором, оценкой
result: [pending]

### 7. E2E suite
expected: pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts — exit code 0
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
