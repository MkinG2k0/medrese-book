---
status: testing
phase: 14-analytics
source: [14-VERIFICATION.md]
started: 2026-07-12T01:35:00+03:00
updated: 2026-07-12T01:35:00+03:00
---

## Current Test

number: 1
name: E2E wave gate — subject picker и subject-scoped history
expected: |
  pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts
  Все тесты проходят: селект «Предмет» виден; subjectId в URL; модалка истории открывается; смена предмета сбрасывает groupId (или skip при одном предмете в seed)
awaiting: user response

## Tests

### 1. E2E wave gate
expected: Playwright specs зелёные для subject picker и scoped history
result: [pending]

### 2. Role-scoped список предметов
expected: Учитель видит только предметы своих групп; менеджер — все предметы
result: [pending]

### 3. F5 с subjectId в URL
expected: После перезагрузки тот же предмет выбран, метрики в том же скоупе
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
