---
status: complete
phase: 13-journal
source: [13-VERIFICATION.md]
started: 2026-07-11T21:45:00Z
updated: 2026-07-12T00:56:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Визуальная компоновка Select на /journal
expected: Select группы в одной строке с date picker; опции «Группа — Предмет»
result: pass

### 2. Контекст группы/предмета на странице урока
expected: Secondary text «{groupName} · {subjectName}» под именем ученика; ссылка «История шагов» с groupId
result: pass

### 3. Независимый выбор группы на /journal/history
expected: Select группы не наследует выбор с /journal; отдельный localStorage ключ (journal:history:lastGroupId)
result: pass

### 4. Modal при смене группы во время активного урока
expected: modal.confirm «Урок идёт в другой группе. Переключить?»; отмена оставляет текущую группу
result: pass

### 5. Таймер и сохранение сессии с groupId
expected: Teaching session и session POST привязаны к groupId; после сохранения возврат на /journal?date=…&groupId=… той же группы
result: pass

### 6. Смена группы обновляет список учеников
expected: Список учеников меняется при переключении группы; колонка «Текущий шаг» отражает enrollment выбранной группы
result: pass

### 7. E2E journal.spec.ts проходит
expected: pnpm test:e2e -- e2e/journal.spec.ts exit code 0; все groupId assertions проходят
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
