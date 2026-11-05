# Phase 16: Cashier role & access - Context

**Gathered:** 2026-11-05  
**Status:** Ready for planning

<domain>
## Phase Boundary

Добавить роль **Кассир** (`CASHIER`): доступ только к сценариям **наличных** — приём оплаты наличными в «Платежи» и подтверждение заявок опекуна с методом CASH. Бухгалтер (`ACCOUNTANT`) сохраняет полный доступ ко всей бухгалтерии. Автотесты на разграничение ролей обязательны (TEST-01/04).

Не входит: месяц оплаты/долга (Phase 17), убрать Сальдо (Phase 18), ЗП/окна/каникулы.

</domain>

<decisions>
## Implementation Decisions

### Что делает кассир с наличными
- **D-01:** Кассир работает в **двух** сценариях: (1) приём наличных на `/accounting/payments` (создание оплаты методом CASH), (2) подтверждение заявок опекуна на `/accounting/payment-requests`, когда метод оплаты при подтверждении — **CASH**. — **Reversibility:** costly — размазано по UI + API guards
- **D-02:** Кассир **не** может подтверждать/проводить CARD/TRANSFER и не работает с расходами, ЗП, ledger, dashboard, month-close, donations (кроме если уже было только у бухгалтера).

### Экраны и навигация
- **D-03:** Меню кассира: только **Платежи** и **Заявки на оплату** (и общий shell: выход/профиль по существующим паттернам). Нет дашборда, ЗП, расходов, журнала операций. Default redirect кассира → `/accounting/payments`.
- **D-04:** Middleware / `ROLE_ROUTES`: `CASHIER` allow на `/accounting/payments` и `/accounting/payment-requests`; deny на остальные `/accounting/*` (кроме публичных нерелевантных). ACCOUNTANT без регресса.

### Создание vs сторно
- **D-05:** Кассир **может создавать** tuition payment с методом **только CASH** (UI фиксирует/ограничивает метод). CARD/TRANSFER — только бухгалтер.
- **D-06:** Кассир **не** может реверсить/сторнировать платежи — только ACCOUNTANT. Кнопки реверса скрыты; API deny.

### Роль в модели данных
- **D-07:** Добавить enum `Role.CASHIER` в Prisma + валидации пользователей + seed тестового кассира для E2E. — **Reversibility:** one-way — Prisma enum migration
- **D-08:** Создание/редактирование пользователей: менеджер/супер-админ может назначить роль Кассир (как сейчас для ACCOUNTANT).

### Claude's Discretion
- Точные тексты меню («Касса» vs «Платежи») — по существующим лейблам accounting, без нового бренда
- Как именно в UI payment-requests ограничить метод для кассира (radio только CASH / скрыть другие) — выбрать паттерн Ant Design рядом с текущим `PaymentRequestsPage`
- Нужен ли кассиру read-only просмотр истории платежей в drawer на payments — да, если уже есть у бухгалтера на той же странице (без реверса)

</decisions>

<canonical_refs>
## Canonical References

### Milestone / requirements
- `.planning/REQUIREMENTS.md` — CASH-01…03, TEST-01, TEST-04, D-M2, D-M6
- `.planning/ROADMAP.md` — Phase 16 success criteria
- `.planning/PROJECT.md` — Current Milestone v3.0, constraints

### Code patterns
- `src/shared/lib/match-role-route.ts` — ROLE_ROUTES / longest-prefix matching
- `src/shared/lib/match-role-route.test.ts` — regression pattern for nested routes
- `src/shared/lib/get-default-redirect.ts` — per-role home
- `src/shared/lib/validations/user.ts` — Role enum in Zod
- `prisma/schema.prisma` — `enum Role`
- `src/widgets/app-shell/ui/AppShell.tsx` — MENU_ORDER_BY_ROLE / menu items
- `src/features/accounting/ui/StudentPaymentsPage.tsx` — приём платежей
- `src/features/accounting/ui/PaymentRequestsPage.tsx` — подтверждение заявок
- `src/features/accounting/actions/payment-request-actions.ts` — confirmTuitionPaymentRequest (ACCOUNTANT today)
- `src/app/api/accounting/payments/route.ts` — payment create API auth
- `.cursor/rules/new-module-tests.mdc` — E2E обязательны в том же изменении

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `matchRoleRouteAccess` + unit tests — расширить CASHIER prefixes
- `authorizeApiRequest({ allowedRoles })` — добавить CASHIER только на cash endpoints
- `StudentPaymentsPage` / `PaymentRequestsPage` — ограничить method=CASH для CASHIER
- Seed codes pattern in `e2e/helpers/codes.ts` — новый код кассира

### Established Patterns
- ACCOUNTANT-only pages use `requireRole('ACCOUNTANT')` in RSC pages
- API: `authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })`
- Nested route: `/accounting/my-salary` TEACHER vs `/accounting` ACCOUNTANT — longest prefix wins

### Integration Points
- Prisma Role enum migration (prod-safe ADD VALUE)
- User admin create/edit role select
- AppShell menu filtering by role
- Payment create + reverse APIs; payment-request confirm action

</code_context>

<specifics>
## Specific Ideas

User: «делай по рекомендации» — оба наличных сценария, узкое меню, без сторно у кассира.

</specifics>

<deferred>
## Deferred Ideas

- Долг/оплата **по месяцам** и неоплаченные в селекте — Phase 17
- Убрать колонку «Сальдо» — Phase 18
- ЗП формула / UI-конфиг параметров — v3.1
- Партнёр / пожертвования — v3.3

</deferred>

---

*Phase: 16-cashier-role-access*  
*Context gathered: 2026-11-05*
