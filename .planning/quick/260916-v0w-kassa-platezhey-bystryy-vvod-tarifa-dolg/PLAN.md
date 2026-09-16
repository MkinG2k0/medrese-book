---
phase: 260916-v0w-kassa-platezhey-bystryy-vvod-tarifa-dolg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/accounting/ui/StudentPaymentsPage.tsx
  - src/features/accounting/lib/payment-suggestions.ts
  - src/features/accounting/lib/payment-method-storage.ts
  - src/features/accounting/lib/query-student-payment-history.ts
  - src/features/accounting/lib/accounting-mutations.ts
  - src/shared/lib/validations/accounting.ts
  - src/app/api/accounting/payments/batch/route.ts
  - src/app/api/accounting/payments/history/route.ts
  - docs/accounting.md
autonomous: true
requirements:
  - QUICK-kassa-payments-ux
user_setup: []

must_haves:
  truths:
    - "В строке есть быстрые действия Оплатить тариф и Погасить долг"
    - "Модалка поддерживает Сохранить и ещё, дату, префилл суммы и запоминание способа оплаты"
    - "Таблица фильтруется по группе и поиску, показывает причину скидки"
    - "Есть инлайн-ввод суммы, массовая оплата тарифа, история платежей со сторно и Excel-экспорт"
  artifacts:
    - path: src/features/accounting/ui/StudentPaymentsPage.tsx
      provides: "Касса платежей с быстрым и массовым вводом"
    - path: src/app/api/accounting/payments/batch/route.ts
      provides: "Пакетное создание платежей"
    - path: src/app/api/accounting/payments/history/route.ts
      provides: "История платежей ученика"
---

<objective>
Ускорить заполнение платы учеников: быстрые кнопки, префиллы, режим кассы (инлайн, массово, история/сторно, Excel).
</objective>
