---
status: complete
phase: 10-subject-foundation
source: [10-VERIFICATION.md]
started: 2026-07-07T18:45:00Z
updated: 2026-07-07T18:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Полный сценарий менеджера — предметы → программа → уровень → шаг
expected: Создать предмет → открыть программу → создать уровень (модал) → создать шаг с Tiptap → вернуться к списку шагов. Breadcrumbs и глобальные номера шагов корректны.
result: pass

### 2. Tiptap в контексте предмета
expected: Ввести текст, арабский блок, изображение в редакторе шага; сохранить и перезагрузить — контент сохраняется в Step.content, редирект на programLevelPath.
result: pass
retest_note: "pass после hotfix 36c5c1f (caption nullish)"

### 3. Удаление предмета с программой и без
expected: Предмет с levelCount > 0 — ошибка «Нельзя удалить предмет с программой…»; пустой предмет удаляется после deleteLevel всех уровней.
result: pass

### 4. Seed — три предмета с разным объёмом программы
expected: После pnpm db:seed — Коран (полная программа), Таджвид (2×3 шага), Арабский (3×5 шагов); ученики на уровнях Корана.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[resolved — test 2 retest passed after 36c5c1f]
