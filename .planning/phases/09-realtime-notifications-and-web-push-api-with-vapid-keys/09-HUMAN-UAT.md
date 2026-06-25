---
status: resolved
phase: 09-realtime-notifications-and-web-push-api-with-vapid-keys
source: [09-VERIFICATION.md]
started: 2026-06-25T11:15:00Z
updated: 2026-06-25T12:00:00Z
approved: 2026-06-25T12:00:00Z
---

## Current Test

all passed

## Tests

### 1. OS-level Web Push при закрытой вкладке
expected: После подписки через «Включить уведомления» и создания заявки на отпуск пользователь получает нативное push-уведомление ОС
result: passed

### 2. Регистрация service worker /sw.js
expected: DevTools → Application → Service Workers: /sw.js active после opt-in
result: passed

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
