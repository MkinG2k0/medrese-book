---
title: "Cron-напоминание опекуну EOM 12:00 МСК"
quick_id: 261003-wwx
slug: cron-napominanie-v-kontse-mesyatsa-v-12-
status: complete
date: 2026-10-03
taiga_url:
---

# Summary

В последний день месяца опекун с долгом получает одно in-app + Web Push напоминание.

## Done

- `GET /api/internal/cron/tuition-reminders` + `CRON_SECRET`
- Календарь `Europe/Moscow`: не последний день — no-op (можно ставить cron 28–31 в 09:00 UTC)
- Получатели: `PARENT` с ACTIVE-ребёнком и `balanceKopecks < 0`
- Идемпотентность по `payload.month`
- `NotificationType.TUITION_PAYMENT_REMINDER`, ссылка `/parent/pay`

## Out of scope

- SMS
- Напоминание учителю/ученику
- Эквайринг
