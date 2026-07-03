import type { PaymentMethod, ExpenseCategory, SalaryAccrualStatus } from '@/shared/lib/prisma'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	CASH: 'Наличные',
	CARD: 'Карта',
	TRANSFER: 'Перевод',
}

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
	SUPPLIES: 'Расходники',
	UTILITIES: 'Коммунальные',
	RENT: 'Аренда',
	OTHER: 'Прочее',
}

const SALARY_STATUS_LABELS: Record<SalaryAccrualStatus, string> = {
	DRAFT: 'Черновик',
	CONFIRMED: 'Подтверждено',
	PAID: 'Выплачено',
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
	return PAYMENT_METHOD_LABELS[method]
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
	return EXPENSE_CATEGORY_LABELS[category]
}

export function getSalaryStatusLabel(status: SalaryAccrualStatus): string {
	return SALARY_STATUS_LABELS[status]
}

export const PAYMENT_METHOD_OPTIONS = (
	Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }))

export const EXPENSE_CATEGORY_OPTIONS = (
	Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]
).map(([value, label]) => ({ value, label }))
