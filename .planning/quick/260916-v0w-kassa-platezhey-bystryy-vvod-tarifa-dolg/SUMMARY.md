---
status: complete
phase: 260916-v0w-kassa-platezhey-bystryy-vvod-tarifa-dolg
completed: 2026-09-16
---

# Summary: Касса платежей

## Done

- Быстрые кнопки **Тариф** / **Долг** в строке (остаток до начисления / погашение сальдо).
- Модалка: дата, префилл суммы, **Тариф/Долг**, **Сохранить и ещё**, способ в `localStorage`.
- Фильтр по группе, поиск, причина скидки под тарифом.
- Режим кассы: инлайн сумма + Enter/Внести, чекбоксы + **Тариф выбранным**, история drawer + сторно, **Excel**.
- API: `POST /api/accounting/payments/batch`, `GET /api/accounting/payments/history`.
- Юнит-тесты подсказок сумм; обновлён `docs/accounting.md`.

## Files

- `src/features/accounting/ui/StudentPaymentsPage.tsx`
- `src/features/accounting/ui/PaymentHistoryDrawer.tsx`
- `src/features/accounting/ui/MoneyInput.tsx`
- `src/features/accounting/lib/payment-suggestions.ts`
- `src/features/accounting/lib/payment-method-storage.ts`
- `src/features/accounting/lib/query-student-payment-history.ts`
- `src/features/accounting/lib/accounting-mutations.ts`
- `src/app/api/accounting/payments/batch/route.ts`
- `src/app/api/accounting/payments/history/route.ts`
- `src/shared/lib/validations/accounting.ts`
- `docs/accounting.md`
