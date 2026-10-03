---
title: Cron-напоминание опекуну EOM 12:00 МСК
quick_id: 261003-wwx
status: planned
---

# Plan

## Goal

В последний календарный день месяца в 12:00 Europe/Moscow опекун (`PARENT`) получает одно in-app + Web Push напоминание оплатить обучение. Учителя и ученики не получают.

## Decisions

- HTTP cron (`GET /api/internal/cron/tuition-reminders` + `CRON_SECRET`), как `generate-charges`. Не `node-cron` в процессе.
- Проверка «последний день» внутри хендлера по календарю Москвы — планировщик может дергать 28–31.
- Получатели: `PARENT` с ≥1 ACTIVE-ребёнком и долгом (`balanceKopecks < 0`).
- Идемпотентность: не слать повторно тому же опекуну за тот же `YYYY-MM`.
- Копирайт: заголовок «Оплата обучения», ссылка `/parent/pay`.

## Tasks

1. Prisma `NotificationType.TUITION_PAYMENT_REMINDER` + domain event + build/enqueue.
2. `sendTuitionReminders` + cron route + `deliverNotifications`.
3. Unit-тесты календаря Москвы, получателей, идемпотентности, билдера.
