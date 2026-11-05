# Phase 17: Tuition month & unpaid visibility - Pattern Map

**Mapped:** 2026-11-05  
**Files analyzed:** 26  
**Analogs found:** 26 / 26

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` (`TuitionPayment` / `TuitionPaymentRequest.month`) | model | CRUD | `TuitionCharge` in same file | exact |
| `prisma/migrations/*_tuition_payment_month/migration.sql` | migration | batch | `prisma/migrations/20260707180000_add_subject/migration.sql` | exact |
| `src/shared/lib/validations/accounting.ts` | utility | request-response | same file (`monthSchema`, create schemas) | exact |
| `src/shared/lib/accounting/month.ts` | utility | transform | same file (`previousMonthKey` / `parseMonthKey`) | exact |
| `src/shared/lib/match-role-route.ts` | middleware | request-response | same file (Phase 16 cash-desk prefixes) | exact |
| `src/widgets/app-shell/ui/AppShell.tsx` | component | request-response | same file (`CASHIER` / `accountantMenuOrder`) | exact |
| `src/features/parent-portal/lib/unpaid-months.ts` | utility | transform | `src/features/accounting/lib/compute-student-balance.ts` + `send-tuition-reminders.ts` | role-match |
| `src/features/parent-portal/lib/unpaid-months.test.ts` | test | transform | `src/features/accounting/lib/accounting-rules.test.ts` | role-match |
| `src/features/parent-portal/lib/parent-pay-draft.ts` | utility | file-I/O | same file | exact |
| `src/features/parent-portal/ui/ParentPayForm.tsx` | component | request-response | same + `AwardsManager` `optionRender` | exact / role-match |
| `src/features/parent-portal/actions/parent-payment-actions.ts` | service | CRUD | same file | exact |
| `src/features/accounting/lib/query-student-payments.ts` | service | CRUD | same file | exact |
| `src/features/accounting/lib/query-tuition-debts.ts` | service | CRUD | `query-student-payments.ts` | exact |
| `src/features/accounting/lib/accounting-mutations.ts` | service | CRUD | same file (`createTuitionPayment` / `reverseTuitionPayment`) | exact |
| `src/features/accounting/actions/payment-request-actions.ts` | service | CRUD | same file | exact |
| `src/features/accounting/ui/StudentPaymentsPage.tsx` | component | CRUD | same file | exact |
| `src/features/accounting/ui/PaymentRequestsPage.tsx` | component | CRUD | same file | exact |
| `src/features/accounting/ui/TuitionDebtsPage.tsx` | component | CRUD | `PaymentRequestsPage.tsx` + `StudentPaymentsPage.tsx` Table | role-match |
| `src/features/accounting/index.ts` | config | — | same barrel | exact |
| `src/app/(dashboard)/accounting/debts/page.tsx` | route | request-response | `accounting/payment-requests/page.tsx` | exact |
| `src/app/api/accounting/payments/route.ts` | route | CRUD | same file | exact |
| `src/app/api/accounting/payments/batch/route.ts` | route | CRUD | same file | exact |
| `src/shared/lib/validations/tuition-payment-request.test.ts` | test | request-response | same file | exact |
| `src/shared/lib/match-role-route.test.ts` | test | request-response | same file (cashier matrix) | exact |
| `src/features/accounting/lib/accounting-rules.test.ts` (or new attribution test) | test | transform | same file | exact |
| `e2e/tuition-month.spec.ts` | test | request-response | `e2e/cashier-role.spec.ts` | exact |

## Pattern Assignments

### `prisma/schema.prisma` — `month` on Payment + Request (model, CRUD)

**Analog:** `TuitionCharge` (lines 342–352)

**Core pattern:**
```prisma
model TuitionCharge {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  month     String
  amount    Int
  createdAt DateTime @default(now())

  @@unique([studentId, month])
  @@index([month])
}
```

**Apply:** Add required `month String` on `TuitionPayment` (+ `@@index([studentId, month])`) and `TuitionPaymentRequest` (+ `@@index([month])`). Do not invent a second format — mirror charge `YYYY-MM`.

---

### `prisma/migrations/*_tuition_payment_month/migration.sql` (migration, batch)

**Analog:** `prisma/migrations/20260707180000_add_subject/migration.sql` (lines 16–21)

**Core expand + backfill pattern:**
```sql
ALTER TABLE "Level" ADD COLUMN "subjectId" TEXT;
UPDATE "Level" SET "subjectId" = 'clq10defaultquransubject00';
ALTER TABLE "Level" ALTER COLUMN "subjectId" SET NOT NULL;
```

**Phase 17 shape (from RESEARCH):** nullable ADD → Moscow `to_char` backfill → `SET NOT NULL` → indexes. Payments from `date`; requests from `createdAt`. No DROP/DELETE.

---

### `src/shared/lib/validations/accounting.ts` (utility, request-response)

**Analog:** same file — existing `monthSchema` + create schemas (lines 5–48, 118–128)

**Validation pattern:**
```typescript
const monthSchema = z
	.string()
	.regex(/^\d{4}-\d{2}$/, 'Некорректный месяц (YYYY-MM)')

export const createTuitionPaymentSchema = z.object({
	studentId: z.string().min(1),
	date: dateSchema,
	amountKopecks: positiveKopecksSchema,
	method: paymentMethodSchema,
	comment: z.string().trim().optional(),
})

export const createTuitionPaymentRequestSchema = z.object({
	lines: z.array(/* ... */).min(1).max(20),
})
```

**Apply:** Add required `month: monthSchema` to `createTuitionPaymentSchema`, `createTuitionPaymentsBatchSchema`, and `createTuitionPaymentRequestSchema`. Keep Russian Zod messages.

---

### `src/shared/lib/accounting/month.ts` (utility, transform)

**Analog:** same file (lines 1–38)

**Core helpers:**
```typescript
export function parseMonthKey(month: string): { year: number; month: number } {
	const match = /^(\d{4})-(\d{2})$/.exec(month)
	if (!match) throw new Error('Некорректный месяц')
	return { year: Number(match[1]), month: Number(match[2]) }
}

export function previousMonthKey(month: string): string {
	const { year, month: m } = parseMonthKey(month)
	const date = new Date(year, m - 2, 1)
	return toMonthKey(date)
}
```

**Apply:** Add pure `iterateMonths(from, to)` next to these helpers (reuse `parseMonthKey` / `toMonthKey`). For “current” in parent unpaid range prefer `moscowMonthKey` from `@/shared/lib/moscow-date` when aligning with D-03/D-05 Moscow semantics.

---

### `src/shared/lib/match-role-route.ts` (middleware, request-response)

**Analog:** same file — dual cash-desk prefixes (lines 17–20)

**Auth / route pattern:**
```typescript
'/accounting': ['ACCOUNTANT'],
'/accounting/my-salary': ['TEACHER'],
'/accounting/payments': ['ACCOUNTANT', 'CASHIER'],
'/accounting/payment-requests': ['ACCOUNTANT', 'CASHIER'],
```

**Apply:** Add `'/accounting/debts': ['ACCOUNTANT', 'CASHIER']` — longest-prefix must beat parent `/accounting` or CASHIER is denied (Phase 16 pitfall).

---

### `src/widgets/app-shell/ui/AppShell.tsx` (component, request-response)

**Analog:** same file — menu catalog + role orders (lines 139–262)

**Menu pattern:**
```typescript
"/accounting/payment-requests": {
  key: "/accounting/payment-requests",
  icon: <FileTextOutlined />,
  label: "Заявки на оплату",
},

const accountantMenuOrder = [
  "/accounting",
  "/accounting/payments",
  "/accounting/payment-requests",
  // ...
] as const

CASHIER: [
  "/accounting/payments",
  "/accounting/payment-requests",
  "/settings",
],
```

**Apply:** Register `"/accounting/debts"` item (label «Долги»), insert into `accountantMenuOrder` and `CASHIER` array next to payment-requests.

---

### `src/features/parent-portal/lib/unpaid-months.ts` (utility, transform)

**Analog:** `compute-student-balance.ts` (coverage math) + `send-tuition-reminders.ts` `collectParentIdsWithActiveChildDebt` (pure aggregation)

**Coverage / status pattern** (`compute-student-balance.ts` lines 14–24):
```typescript
export function resolveStudentPaymentStatus(
	balanceKopecks: number,
	monthChargeKopecks: number,
	monthPaidKopecks: number,
): StudentPaymentStatus {
	if (monthChargeKopecks > 0 && monthPaidKopecks >= monthChargeKopecks) {
		// paid
	}
	if (monthChargeKopecks > 0 && monthPaidKopecks > 0) {
		return { kind: 'partial', debtKopecks: monthChargeKopecks - monthPaidKopecks }
	}
	// ...
}
```

**Pure collector pattern** (`send-tuition-reminders.ts` lines 26–46):
```typescript
export function collectParentIdsWithActiveChildDebt(
	students: TuitionReminderStudent[],
): string[] {
	const parentIds = new Set<string>()
	for (const student of students) {
		// pure reduce over charges/payments → decide
	}
	return [...parentIds]
}
```

**Apply:** Export `isMonthUnpaid({ chargeKopecks, paidKopecks })` and builders for month options `{ value, label, unpaid }` (D-06: charge/tariff fallback; partial = unpaid). Keep Prisma out of this file — unit-testable only.

---

### `src/features/parent-portal/lib/unpaid-months.test.ts` (test, transform)

**Analog:** `src/features/accounting/lib/accounting-rules.test.ts`

**Test style:**
```typescript
describe('…', () => {
	it('…', () => {
		expect(/* pure fn */).toBe(/* … */)
	})
})
```

**Apply:** Cases — full cover ⇒ not unpaid; partial ⇒ unpaid; zero charge ⇒ not unpaid; date month ≠ `payment.month` still counts paid for attributed month; any-selected-child unpaid ⇒ yellow (A1).

---

### `src/features/parent-portal/lib/parent-pay-draft.ts` (utility, file-I/O)

**Analog:** same file (lines 1–35)

**Draft pattern:**
```typescript
export type ParentPayDraft = {
	selectedStudentIds: string[]
	amountsKopecks: Record<string, number>
}
```

**Apply:** Add optional `month?: string`; validate `YYYY-MM` on load; persist with amounts/selection.

---

### `src/features/parent-portal/ui/ParentPayForm.tsx` (component, request-response)

**Analog:** same form submit + `AwardsManager` `optionRender` + accounting `Tag color="warning"|"gold"`

**Submit / draft / App.useApp** (ParentPayForm lines 42–132):
```typescript
const { message } = App.useApp()
// …
startTransition(async () => {
	const result = await submitParentPaymentRequest({ lines })
	if (!result.ok) {
		message.error(result.error)
		return
	}
	clearParentPayDraft(parentUserId)
	message.success('Заявка отправлена бухгалтеру')
	router.refresh()
})
```

**optionRender analog** (`AwardsManager.tsx` lines 70–85):
```tsx
<Select
	options={studentOptions}
	optionRender={(option) => (
		<StudentSelectOption
			name={String(option.label)}
			stepNumber={option.data.stepNumber}
			// …
		/>
	)}
/>
```

**Yellow Tag analog** (`StudentPaymentsPage.tsx` lines 52–56):
```tsx
<Tag color="warning">
	Частично ({formatMoney(status.debtKopecks)})
</Tag>
```

**Apply:** Month `Select` with `optionRender` + `Tag color="gold"` «Не оплачен»; submit `{ month, lines }`; hydrate/save draft month; layout via `div` + Tailwind flex (no `<Flex>`).

---

### `src/features/parent-portal/actions/parent-payment-actions.ts` (service, CRUD)

**Analog:** same file (lines 104–181)

**Auth + Zod + ownership + create:**
```typescript
const session = await requireRole('PARENT')
const parsed = createTuitionPaymentRequestSchema.safeParse(input)
// ownership check parentId === session.user.id
const created = await tx.tuitionPaymentRequest.create({
	data: {
		parentId: session.user.id,
		status: 'PENDING',
		lines: { create: parsed.data.lines.map(/* … */) },
	},
})
```

**Apply:** Persist `month: parsed.data.month` on request create; extend `getParentPaymentPageData` / summaries with `month` + unpaid month flags payload for Select (charges + payments with `month` select).

**Result pattern:** `{ ok: true } | { ok: false; error: string }`.

---

### `src/features/accounting/lib/query-student-payments.ts` (service, CRUD)

**Analog:** same file (lines 22–57) — replace date-range filter

**Current anti-pattern to replace:**
```typescript
const { start, end } = monthKeyToDateRange(month)
// …
tuitionPayments: { select: { date: true, amount: true } },
// …
const monthPaidKopecks = student.tuitionPayments
	.filter((payment) => payment.date >= start && payment.date <= end)
	.reduce((sum, payment) => sum + payment.amount, 0)
```

**Target:**
```typescript
tuitionPayments: { select: { month: true, amount: true } },
const monthPaidKopecks = student.tuitionPayments
	.filter((payment) => payment.month === month)
	.reduce((sum, payment) => sum + payment.amount, 0)
```

Keep charge fallback `?.amount ?? student.tuitionRate` (lines 52–54).

---

### `src/features/accounting/lib/query-tuition-debts.ts` (service, CRUD)

**Analog:** `query-student-payments.ts` (findMany ACTIVE students + map rows)

**Query shape to copy:**
```typescript
const students = await prisma.student.findMany({
	where: { status: 'ACTIVE' },
	include: {
		user: { select: { name: true } },
		enrollments: { /* primary group */ },
		tuitionCharges: { select: { month: true, amount: true } },
		tuitionPayments: { select: { month: true, amount: true } },
	},
	orderBy: { user: { name: 'asc' } },
})
```

**Apply:** Emit debt rows `{ studentId, studentName, parentName?, month, charged, paid, debt }` where unpaid per month (reuse `isMonthUnpaid` / same math). Prefer include parent via `student.parent` select if present on Student model. No mutations.

---

### `src/features/accounting/lib/accounting-mutations.ts` (service, CRUD)

**Analog:** same file create + reverse (lines 17–57, 114–151)

**Create pattern:**
```typescript
export async function createTuitionPayment(input: {
	studentId: string
	date: string
	amountKopecks: number
	method: PaymentMethod
	comment?: string
	actorId: string
}) {
	// …
	const payment = await tx.tuitionPayment.create({
		data: {
			studentId: input.studentId,
			date,
			amount: input.amountKopecks,
			method: input.method,
			comment: input.comment,
			createdById: input.actorId,
		},
	})
}
```

**Reversal pattern** (must copy month — pitfall 5):
```typescript
const reversal = await tx.tuitionPayment.create({
	data: {
		studentId: original!.studentId,
		date: new Date(),
		amount: reversalAmount(original!.amount),
		method: original!.method,
		comment,
		createdById: actorId,
		reversalOfId: original!.id,
	},
})
```

**Apply:** Add `month: string` to create/batch inputs and Prisma `data`; set `month: original.month` on reversal.

---

### `src/features/accounting/actions/payment-request-actions.ts` (service, CRUD)

**Analog:** same file list + confirm (lines 35–70, 120–129)

**List DTO / confirm create:**
```typescript
return requests.map((request) => ({
	id: request.id,
	createdAt: request.createdAt.toISOString(),
	parentName: request.parent.name,
	// …
}))

const payment = await tx.tuitionPayment.create({
	data: {
		studentId: line.studentId,
		date,
		amount: line.amount,
		method: parsed.data.method,
		comment,
		createdById: session.user.id,
	},
})
```

**Auth:** `requireRoles([...CASH_DESK_ROLES])` + `assertCashierCashMethod` on confirm.

**Apply:** Include `month` in `AccountantPaymentRequestRow`; on confirm `month: request.month`; `revalidatePath` also `/accounting/debts` if debts depend on payments.

---

### `src/features/accounting/ui/StudentPaymentsPage.tsx` (component, CRUD)

**Analog:** same file `postPayment` / batch (lines 143–301)

**POST body pattern:**
```typescript
const postPayment = async (payload: {
	studentId: string
	amountKopecks: number
	date: string
	method: PaymentMethod
	comment?: string
}) => {
	const res = await fetch('/api/accounting/payments', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	// …
}

body: JSON.stringify({
	date: operationDate.format('YYYY-MM-DD'),
	method,
	items: items.map(({ studentId, amountKopecks }) => ({
		studentId,
		amountKopecks,
	})),
}),
```

**Apply:** Pass page prop `month` into every create/batch/quickPay payload. Optional Tag «За месяц: …» near controls (discretion). Keep `App.useApp()` for message/modal.

---

### `src/features/accounting/ui/PaymentRequestsPage.tsx` (component, CRUD)

**Analog:** same file columns (lines 55–101)

**Column pattern:**
```typescript
const columns: ColumnsType<AccountantPaymentRequestRow> = useMemo(
	() => [
		{ title: 'Дата', dataIndex: 'createdAt', render: /* … */ },
		{ title: 'Опекун', dataIndex: 'parentName', render: /* … */ },
		// …
		{ title: 'Статус', key: 'status', render: () => <Tag color="processing">Ожидает</Tag> },
	],
	[/* deps */],
)
```

**Apply:** Add column `Месяц` → `row.month`; show month in confirm modal content for cashier context (D-09).

---

### `src/features/accounting/ui/TuitionDebtsPage.tsx` (component, CRUD)

**Analog:** `PaymentRequestsPage.tsx` (RSC-fed Table client page) + status Tags from `StudentPaymentsPage`

**Page shell:**
```tsx
return (
	<div className="flex flex-col gap-4">
		<div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div>
				<Title level={3} className="!mb-0">Заявки на оплату</Title>
				<Text type="secondary">…</Text>
			</div>
		</div>
		<Table rowKey="id" columns={columns} dataSource={requests} pagination={false} />
	</div>
)
```

**Apply:** Read-only table columns Ученик / Опекун / Месяц / Начислено / Оплачено / Долг; optional search/group filter minimal; no create actions for CASHIER.

---

### `src/app/(dashboard)/accounting/debts/page.tsx` (route, request-response)

**Analog:** `src/app/(dashboard)/accounting/payment-requests/page.tsx`

**RSC guard + load:**
```typescript
import { listPendingTuitionPaymentRequests } from '@/features/accounting/actions/payment-request-actions'
import { PaymentRequestsPage } from '@/features/accounting/ui/PaymentRequestsPage'
import { requireRoles } from '@/shared/lib/session'

export default async function AccountingPaymentRequestsPage() {
	await requireRoles(['ACCOUNTANT', 'CASHIER'])
	const requests = await listPendingTuitionPaymentRequests()
	return <PaymentRequestsPage requests={requests} />
}
```

**Apply:** `requireRoles(['ACCOUNTANT', 'CASHIER'])` → `queryTuitionDebts()` (or thin server action wrapper) → `<TuitionDebtsPage rows={…} />`. Export page UI from `features/accounting/index.ts`.

---

### `src/app/api/accounting/payments/route.ts` + `batch/route.ts` (route, CRUD)

**Analog:** same files — Zod already drives body; no structural change beyond schema fields flowing into mutations.

**API pattern** (`payments/route.ts` lines 37–56):
```typescript
const parsed = createTuitionPaymentSchema.safeParse(body)
if (!parsed.success) return error(parsed.error.message)
const methodError = assertCashierCashMethod(auth.session.user.role, parsed.data.method)
if (methodError) return error(methodError, 403)
const payment = await createTuitionPayment({
	...parsed.data,
	actorId: auth.session.user.id,
})
return created(payment)
```

**Apply:** After Zod requires `month`, spread into mutations; keep `CASH_DESK_ROLES` + MonthClosedError → 409.

---

### Tests

#### `tuition-payment-request.test.ts`

**Analog:** same file — extend payloads with `month: '2026-09'`; assert missing/invalid month fails.

#### `match-role-route.test.ts`

**Analog:** cashier nested cases (lines 27–50) — add `/accounting/debts` allow for CASHIER+ACCOUNTANT; TEACHER deny.

#### `accounting-rules.test.ts` / attribution unit

**Analog:** same suite — case where `payment.date` in Nov but `payment.month === '2026-09'` contributes to September monthPaid.

#### `e2e/tuition-month.spec.ts`

**Analog:** `e2e/cashier-role.spec.ts`

**E2E pattern:**
```typescript
import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Роль кассира", () => {
  test("вход кассира ведёт на платежи и узкое меню", async ({ page }) => {
    await loginAs(page, TEST_CODES.cashier);
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(page.getByRole("menuitem", { name: "Платежи" })).toBeVisible();
  });
});
```

**Apply:** Parent → `/parent/pay` month Select + gold Tag; accountant+cashier → `/accounting/debts` heading «Долги»; regression create/confirm with month; assert menu item «Долги» for CASHIER. Locators: roles/titles per `.cursor/rules/new-module-tests.mdc`.

---

## Shared Patterns

### Authentication / roles
**Source:** `src/shared/lib/session.ts` via `requireRoles` / `requireRole`; API via `authorizeApiRequest`  
**Apply to:** debts page, payment-request actions, payments API, parent actions  

```typescript
await requireRoles(['ACCOUNTANT', 'CASHIER']) // cash desk / debts
await requireRole('PARENT') // parent portal
```

Plus longest-prefix `ROLE_ROUTES` entry for `/accounting/debts`.

### Error / result handling
**Source:** parent + payment-request actions; API `error`/`created`/`serverError`  
**Apply to:** all mutations  

```typescript
| { ok: true } | { ok: false; error: string }
// API:
if (!parsed.success) return error(parsed.error.message)
if (err instanceof MonthClosedError) return error(err.message, 409)
```

### Validation
**Source:** `src/shared/lib/validations/accounting.ts` `monthSchema`  
**Apply to:** request create, payment create/batch, month query  

### Attribution (monthPaid)
**Source:** switch in `query-student-payments.ts` — filter `payment.month === month`  
**Apply to:** unpaid helper, debts query, status resolution inputs  

### Ant Design UI
**Source:** `App.useApp()`, `Tag color="gold"|"warning"`, Select `optionRender`, Table columns  
**Apply to:** ParentPayForm, TuitionDebtsPage, PaymentRequestsPage month column  
**Rules:** no static `message`/`Modal.confirm`; no hex overrides on Tag; no `<Flex>`.

### Prisma mutations + events
**Source:** `accounting-mutations.ts` / `payment-request-actions.ts`  
**Apply to:** create/confirm/reverse — always write `month`; reverse copies `original.month`; keep `dispatchDomainEvent` in transaction.

### Moscow month backfill / current
**Source:** `src/shared/lib/moscow-date.ts` `moscowMonthKey` + SQL `AT TIME ZONE 'Europe/Moscow'`  
**Apply to:** migration backfill; parent select upper bound (D-05).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 17 files map to existing analogs |

> Note: Ant Design Select yellow unpaid chrome has no identical tuition Select yet; closest are `AwardsManager` `optionRender` + accounting `Tag color="warning"|"gold"` — treat as role-match composite, not greenfield.

## Metadata

**Analog search scope:** `prisma/`, `src/features/accounting/`, `src/features/parent-portal/`, `src/shared/lib/`, `src/widgets/app-shell/`, `src/app/(dashboard)/accounting/`, `src/app/api/accounting/`, `e2e/`  
**Files scanned:** ~40 key analogs  
**Pattern extraction date:** 2026-11-05
