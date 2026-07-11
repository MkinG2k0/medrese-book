---
status: testing
phase: 13-journal
source: [13-VERIFICATION.md]
started: 2026-07-11T21:45:00Z
updated: 2026-07-11T21:45:00Z
---

## Current Test

number: 1
name: Визуальная компоновка Select на /journal
expected: |
  Ant Design Select справа от date picker; опции вида «Группа Аль-Фатиха — …»; при одной группе Select виден, но disabled
awaiting: user response

## Tests

### 1. Визуальная компоновка Select на /journal
expected: Select группы в одной строке с date picker; опции «Группа — Предмет»
result: [pending]

### 2. Контекст группы/предмета на странице урока
expected: Secondary text «{groupName} · {subjectName}» под именем ученика; ссылка «История шагов» с groupId
result: [pending]

### 3. Независимый выбор группы на /journal/history
expected: Select группы не наследует выбор с /journal; отдельный localStorage ключ (journal:history:lastGroupId)
result: [pending]

### 4. Modal при смене группы во время активного урока
expected: modal.confirm «Урок идёт в другой группе. Переключить?»; отмена оставляет текущую группу
result: [pending]

### 5. Таймер и сохранение сессии с groupId
expected: Teaching session и session POST привязаны к groupId; после сохранения возврат на /journal?date=…&groupId=… той же группы
result: [pending]

### 6. Смена группы обновляет список учеников
expected: Список учеников меняется при переключении группы; колонка «Текущий шаг» отражает enrollment выбранной группы
result: [pending]

### 7. E2E journal.spec.ts проходит
expected: pnpm test:e2e -- e2e/journal.spec.ts exit code 0; все groupId assertions проходят
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
