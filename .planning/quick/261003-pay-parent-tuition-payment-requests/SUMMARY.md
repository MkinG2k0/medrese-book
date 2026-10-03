---
quick_id: 261003-pay
slug: parent-tuition-payment-requests
status: complete
date: 2026-10-03
---

# Summary

Страница оплаты для опекуна + заявки бухгалтеру.

## Done

- Prisma: `TuitionPaymentRequest` / `Line` (PENDING → CONFIRMED | REJECTED)
- `/parent/pay`: выбор детей, суммы (дефолт = тариф), draft в localStorage, «Оплатить»
- `/accounting/payment-requests`: подтверждение целиком (создаёт `TuitionPayment`) или отклонение с причиной
- Меню PARENT/ACCOUNTANT

## Out of scope

- Cron-напоминание EOM 12:00
- Эквайринг / SMS
