---
status: complete
phase: 10-subject-foundation
source: [10-VERIFICATION.md]
started: 2026-07-07T18:45:00Z
updated: 2026-07-07T18:48:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Полный сценарий менеджера — предметы → программа → уровень → шаг
expected: Создать предмет → открыть программу → создать уровень (модал) → создать шаг с Tiptap → вернуться к списку шагов. Breadcrumbs и глобальные номера шагов корректны.
result: pass

### 2. Tiptap в контексте предмета
expected: Ввести текст, арабский блок, изображение в редакторе шага; сохранить и перезагрузить — контент сохраняется в Step.content, редирект на programLevelPath.
result: issue
reported: "изображение не работает — ZodError caption: expected string, received null при сохранении шага с картинкой"
severity: major
fix_applied: "36c5c1f — caption nullish в stepContentSchema; tiptap-mapper; alt: '' при вставке"
retest: pending

### 3. Удаление предмета с программой и без
expected: Предмет с levelCount > 0 — ошибка «Нельзя удалить предмет с программой…»; пустой предмет удаляется после deleteLevel всех уровней.
result: pass

### 4. Seed — три предмета с разным объёмом программы
expected: После pnpm db:seed — Коран (полная программа), Таджвид (2×3 шага), Арабский (3×5 шагов); ученики на уровнях Корана.
result: pass

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

```yaml
- truth: "Сохранение шага с блоком image не падает; в БД хранится URL (S3 или /uploads/)"
  status: failed
  reason: "User reported: ZodError caption null при updateStep"
  severity: major
  test: 2
  root_cause: "Tiptap image attrs.alt = null; z.string().optional() не принимает null"
  fix_commit: 36c5c1f
  artifacts:
    - src/shared/lib/validations/step.ts
    - src/features/program-admin/lib/tiptap-mapper.ts
    - src/features/program-admin/ui/editor/StepEditor.tsx
  missing:
    - retest test 2 после hotfix
```
