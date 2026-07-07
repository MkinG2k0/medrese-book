---
status: testing
phase: 10-subject-foundation
source: [10-VERIFICATION.md]
started: 2026-07-07T18:45:00Z
updated: 2026-07-07T18:45:00Z
---

## Current Test

number: 1
name: Полный сценарий менеджера — предметы → программа → уровень → шаг
expected: |
  Все переходы по /admin/subjects/[subjectId]/program/** работают;
  breadcrumbs корректны; глобальный номер шага в скобках отображается per-subject
awaiting: user response

## Tests

### 1. Полный сценарий менеджера — предметы → программа → уровень → шаг
expected: Создать предмет → открыть программу → создать уровень (модал) → создать шаг с Tiptap → вернуться к списку шагов. Breadcrumbs и глобальные номера шагов корректны.
result: [pending]

### 2. Tiptap в контексте предмета
expected: Ввести текст, арабский блок, изображение в редакторе шага; сохранить и перезагрузить — контент сохраняется в Step.content, редирект на programLevelPath.
result: [pending]

### 3. Удаление предмета с программой и без
expected: Предмет с levelCount > 0 — ошибка «Нельзя удалить предмет с программой…»; пустой предмет удаляется после deleteLevel всех уровней.
result: [pending]

### 4. Seed — три предмета с разным объёмом программы
expected: После pnpm db:seed — Коран (полная программа), Таджвид (2×3 шага), Арабский (3×5 шагов); ученики на уровнях Корана.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
