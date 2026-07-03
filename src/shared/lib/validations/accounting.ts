import { z } from 'zod'

const monthSchema = z
	.string()
	.regex(/^\d{4}-\d{2}$/, 'Некорректный месяц (YYYY-MM)')

const dateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректная дата')

const positiveKopecksSchema = z
	.number()
	.int('Сумма должна быть целым числом копеек')
	.positive('Сумма должна быть больше нуля')

export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'TRANSFER'])

export const expenseCategorySchema = z.enum([
	'SUPPLIES',
	'UTILITIES',
	'RENT',
	'OTHER',
])

export const createTuitionPaymentSchema = z.object({
	studentId: z.string().min(1),
	date: dateSchema,
	amountKopecks: positiveKopecksSchema,
	method: paymentMethodSchema,
	comment: z.string().trim().optional(),
})

export const reverseFinancialRecordSchema = z.object({
	comment: z.string().trim().min(1, 'Комментарий обязателен для сторно'),
})

export const createExpenseSchema = z.object({
	date: dateSchema,
	amountKopecks: positiveKopecksSchema,
	category: expenseCategorySchema,
	method: paymentMethodSchema,
	comment: z.string().trim().optional(),
})

export const createDonationSchema = z.object({
	date: dateSchema,
	amountKopecks: positiveKopecksSchema,
	method: paymentMethodSchema,
	comment: z.string().trim().optional(),
})

export const createSalaryPayoutSchema = z.object({
	accrualId: z.string().min(1),
	date: dateSchema,
	amountKopecks: positiveKopecksSchema,
	method: paymentMethodSchema,
	comment: z.string().trim().optional(),
})

export const monthQuerySchema = z.object({
	month: monthSchema,
})

export const generateChargesSchema = z.object({
	month: monthSchema.optional(),
})

export const closeMonthSchema = z.object({
	month: monthSchema,
})

export const adjustSessionDurationSchema = z.object({
	adjustedMinutes: z
		.number()
		.int()
		.min(1, 'Длительность должна быть не менее 1 минуты')
		.max(480, 'Длительность не может превышать 8 часов'),
	reason: z.string().trim().min(1, 'Укажите причину корректировки'),
})

export const setTeacherRateSchema = z.object({
	teacherId: z.string().min(1),
	hourlyRateKopecks: z.number().int().min(0),
	validFrom: dateSchema,
})

export const updateStudentTuitionSchema = z.object({
	tuitionRateKopecks: z.number().int().positive('Тариф должен быть больше нуля'),
	discountReason: z.string().trim().optional(),
})

export const exportQuerySchema = z.object({
	from: dateSchema,
	to: dateSchema,
	type: z.enum(['payments', 'salaries', 'ledger']),
})

export type CreateTuitionPaymentInput = z.infer<typeof createTuitionPaymentSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type CreateDonationInput = z.infer<typeof createDonationSchema>
export type CreateSalaryPayoutInput = z.infer<typeof createSalaryPayoutSchema>
