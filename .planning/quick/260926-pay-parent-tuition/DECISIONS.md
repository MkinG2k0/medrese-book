---
title: Оплата и учётка родителя
status: decisions-locked
date: 2026-09-26
---

# Оплата + PARENT — зафиксированные решения

## Product

- Оплата с учётки **родителя**: ввод сумм → «Оплатить» → **заявка**.
- Бухгалтер подтверждает заявку **целиком** (все дети пакетом).
- Родитель видит прогресс своих детей и страницу оплаты.
- При создании ученика: выбрать существующего опекуна / ввести данные / авто `Опекун {ФИО}`.
- Напоминание **только родителю**, конец месяца **12:00 МСК**, in-app (+ push).
- Учётка родителя создаётся вместе с учеником (по умолчанию).
- 1 родитель → N учеников.

## Locked answers (2026-09-26)

| # | Вопрос | Ответ |
|---|--------|--------|
| 1 | Подтверждение мульти-заявки | **Целиком** |
| 2 | Кому напоминание | **Только родителю** |
| 3 | Сумма по умолчанию | **Тариф** (`tuitionRate`) |
| 4 | Миграция старых guardianName/Phone → PARENT | **Нет** |

## Create student modal

1. Селект поиска опекуна сверху.
2. Если выбран — имя и телефон **locked**.
3. Если введены имя/телефон — создать нового PARENT + код.
4. Если пусто — создать `Опекун {ФИО ученика}`, телефон пустой + код.

Старые поля `Student.guardianName` / `guardianPhone` **не мигрируем**; новая связь через `parentId` (или эквивалент). Решение по deprecate старых полей — при реализации.

## Payment request model (intent)

- `TuitionPaymentRequest`: PENDING → CONFIRMED | REJECTED
- Lines: studentId + amountKopecks (разные суммы)
- Confirm: создаёт `TuitionPayment` на каждую строку одной транзакцией
- Reject: с причиной (минимум), без платежей
- Draft в localStorage на parent userId: выбранные дети + суммы

## Reminder

- Cron: последний день месяца, 12:00 Europe/Moscow
- Recipient: User(PARENT)
- Scope: родители с хотя бы одним ACTIVE-ребёнком (уточнить при plan: только с долгом или всем — default: с долгом/начислением предпочтительнее; если не уточнено — **всем с ACTIVE детьми** или **с положительным долгом** — зафиксировать в plan-phase)

## Out of scope (now)

- Эквайринг / онлайн-касса
- SMS на телефон
- Подтверждение заявки построчно
- Автомиграция legacy guardian fields

## Suggested implementation waves

1. `Role.PARENT` + schema link + create/edit student modal + login code
2. Parent portal: children list + progress
3. Payment requests + accountant confirm UI
4. Draft remember (children + amounts)
5. Cron reminder 12:00 EOM
