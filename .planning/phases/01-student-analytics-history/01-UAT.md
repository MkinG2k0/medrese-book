---
status: testing
phase: 01-student-analytics-history
source: [01-VERIFICATION.md]
started: 2026-07-01T19:50:00Z
updated: 2026-07-01T19:50:00Z
---

## Current Test

number: 1
name: E2E student-analytics.spec.ts
expected: |
  4/4 green — таймер урока, at-risk→история с колонкой «Длительность занятия», портал без «Требуют внимания»
awaiting: user response

## Tests

### 1. E2E student-analytics.spec.ts
expected: `pnpm exec playwright test e2e/student-analytics.spec.ts` — все 4 теста green
result: [pending]

### 2. Elapsed-таймер во время активного урока
expected: «Длительность» растёт во время урока; после «Закончить урок» журнал разблокирован
result: [pending]

### 3. NormWarningAlert на странице урока
expected: Жёлтый Alert «Превышен норматив времени на текущем уровне» при TIME_NORM
result: [pending]

### 4. JournalRiskBadge в списке журнала
expected: Tag «Норматив» и/или «Пропуски» рядом с именем ученика с riskFlags (TEACHER/MANAGER)
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
