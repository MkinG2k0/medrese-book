# Quick Task 260625-krf — Summary

**Task:** Простой мессенджер с правилами доступа по ролям  
**Commit:** 044094d  
**Date:** 2026-06-25

## Что сделано

1. **Модели БД** — `Conversation` (два участника, уникальная пара) и `Message` с миграцией `add_messaging`.
2. **Правила доступа** (`can-message-user.ts`):
   - Менеджер → учителя и ученики
   - Учитель → менеджеры + ученики своих групп (включая замещение)
   - Ученик → свой учитель + менеджеры
   - Супер-админ исключён
3. **API** — `/api/messaging/contacts`, `/api/conversations`, `/api/conversations/[id]/messages`.
4. **UI** — страница `/messages`, пункт меню «Сообщения», список диалогов + панель чата, polling 5 с.
5. **Тесты** — unit-тесты доступа, e2e `messages.spec.ts`.

## Не в scope

- Просмотр менеджером всех чатов системы (CHAT-03) — отдельное требование Phase 7.
- WebSocket / realtime — асинхронный polling по PROJECT.md.

## Проверка

```bash
pnpm vitest run src/shared/lib/messaging/can-message-user.test.ts
pnpm test:e2e e2e/messages.spec.ts
```
