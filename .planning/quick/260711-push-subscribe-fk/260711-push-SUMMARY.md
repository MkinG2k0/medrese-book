---
status: complete
---

# Quick Task 260711-push-subscribe-fk — Summary

**Task:** Исправить 500 на POST /api/push/subscribe (FK PushSubscription_userId_fkey)  
**Date:** 2026-07-11

## Причина

JWT-сессия содержала `user.id`, которого уже нет в БД (типично после `db:seed` / reseed). Upsert падал с P2003 вместо понятного ответа.

## Что сделано

1. Перед upsert проверяется наличие пользователя в `User`; при отсутствии — 401.
2. `usePushAutoSubscribe` игнорирует 401 при авто-синхронизации подписки.
3. Unit-тесты для маршрута.

## Как проверить

1. Перелогиниться (если сессия устарела после reseed).
2. Разрешить уведомления и перезагрузить страницу — POST /api/push/subscribe должен вернуть 201, без `[API Error]` в консоли сервера.
