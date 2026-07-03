import { toSessionDate } from '@/shared/lib/calendar-date'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import type { ExpenseCategory, PaymentMethod } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'

import { assertMonthOpenForDate } from './assert-month-open'
import {
	reversalAmount,
	validateReversalTarget,
} from './create-reversal'
import { getSessionDurationMinutes } from './teacher-hours'

function parseOperationDate(dateStr: string): Date {
	return toSessionDate(dateStr)
}

export async function createTuitionPayment(input: {
	studentId: string
	date: string
	amountKopecks: number
	method: PaymentMethod
	comment?: string
	actorId: string
}) {
	const date = parseOperationDate(input.date)
	await assertMonthOpenForDate(date)

	return prisma.$transaction(async (tx) => {
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

		await dispatchDomainEvent(
			{
				actorId: input.actorId,
				action: 'TUITION_PAYMENT_CREATED',
				entityType: 'TuitionPayment',
				entityId: payment.id,
				payload: {
					studentId: input.studentId,
					amount: input.amountKopecks,
					method: input.method,
				},
			},
			tx,
		)

		return payment
	})
}

export async function reverseTuitionPayment(
	paymentId: string,
	comment: string,
	actorId: string,
) {
	const original = await prisma.tuitionPayment.findUnique({
		where: { id: paymentId },
		include: { reversals: true },
	})
	validateReversalTarget(original, 'Платёж')
	await assertMonthOpenForDate(original!.date)

	return prisma.$transaction(async (tx) => {
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

		await dispatchDomainEvent(
			{
				actorId,
				action: 'TUITION_PAYMENT_REVERSED',
				entityType: 'TuitionPayment',
				entityId: reversal.id,
				payload: { originalId: original!.id, comment },
			},
			tx,
		)

		return reversal
	})
}

export async function createExpense(input: {
	date: string
	amountKopecks: number
	category: ExpenseCategory
	method: PaymentMethod
	comment?: string
	actorId: string
}) {
	const date = parseOperationDate(input.date)
	await assertMonthOpenForDate(date)

	return prisma.$transaction(async (tx) => {
		const expense = await tx.expense.create({
			data: {
				date,
				amount: input.amountKopecks,
				category: input.category,
				method: input.method,
				comment: input.comment,
				createdById: input.actorId,
			},
		})

		await dispatchDomainEvent(
			{
				actorId: input.actorId,
				action: 'EXPENSE_CREATED',
				entityType: 'Expense',
				entityId: expense.id,
				payload: { amount: input.amountKopecks, category: input.category },
			},
			tx,
		)

		return expense
	})
}

export async function reverseExpense(
	expenseId: string,
	comment: string,
	actorId: string,
) {
	const original = await prisma.expense.findUnique({
		where: { id: expenseId },
		include: { reversals: true },
	})
	validateReversalTarget(original, 'Расход')

	return prisma.$transaction(async (tx) => {
		const reversal = await tx.expense.create({
			data: {
				date: new Date(),
				amount: reversalAmount(original!.amount),
				category: original!.category,
				method: original!.method,
				comment,
				createdById: actorId,
				reversalOfId: original!.id,
			},
		})

		await dispatchDomainEvent(
			{
				actorId,
				action: 'EXPENSE_REVERSED',
				entityType: 'Expense',
				entityId: reversal.id,
				payload: { originalId: original!.id, comment },
			},
			tx,
		)

		return reversal
	})
}

export async function createDonation(input: {
	date: string
	amountKopecks: number
	method: PaymentMethod
	comment?: string
	actorId: string
}) {
	const date = parseOperationDate(input.date)
	await assertMonthOpenForDate(date)

	return prisma.$transaction(async (tx) => {
		const donation = await tx.donation.create({
			data: {
				date,
				amount: input.amountKopecks,
				method: input.method,
				comment: input.comment,
				createdById: input.actorId,
			},
		})

		await dispatchDomainEvent(
			{
				actorId: input.actorId,
				action: 'DONATION_CREATED',
				entityType: 'Donation',
				entityId: donation.id,
				payload: { amount: input.amountKopecks },
			},
			tx,
		)

		return donation
	})
}

export async function reverseDonation(
	donationId: string,
	comment: string,
	actorId: string,
) {
	const original = await prisma.donation.findUnique({
		where: { id: donationId },
		include: { reversals: true },
	})
	validateReversalTarget(original, 'Пожертвование')

	return prisma.$transaction(async (tx) => {
		const reversal = await tx.donation.create({
			data: {
				date: new Date(),
				amount: reversalAmount(original!.amount),
				method: original!.method,
				comment,
				createdById: actorId,
				reversalOfId: original!.id,
			},
		})

		await dispatchDomainEvent(
			{
				actorId,
				action: 'DONATION_REVERSED',
				entityType: 'Donation',
				entityId: reversal.id,
				payload: { originalId: original!.id, comment },
			},
			tx,
		)

		return reversal
	})
}

export async function createSalaryPayout(input: {
	accrualId: string
	date: string
	amountKopecks: number
	method: PaymentMethod
	comment?: string
	actorId: string
}) {
	const date = parseOperationDate(input.date)
	await assertMonthOpenForDate(date)

	const accrual = await prisma.salaryAccrual.findUnique({
		where: { id: input.accrualId },
	})
	if (!accrual || accrual.status === 'DRAFT') {
		throw new Error('Сначала подтвердите начисление')
	}

	return prisma.$transaction(async (tx) => {
		const payout = await tx.salaryPayout.create({
			data: {
				accrualId: input.accrualId,
				date,
				amount: input.amountKopecks,
				method: input.method,
				comment: input.comment,
				createdById: input.actorId,
			},
		})

		const paid = await tx.salaryPayout.aggregate({
			where: { accrualId: input.accrualId },
			_sum: { amount: true },
		})
		if ((paid._sum.amount ?? 0) >= accrual.amount) {
			await tx.salaryAccrual.update({
				where: { id: input.accrualId },
				data: { status: 'PAID' },
			})
		}

		await dispatchDomainEvent(
			{
				actorId: input.actorId,
				action: 'SALARY_PAYOUT_CREATED',
				entityType: 'SalaryPayout',
				entityId: payout.id,
				payload: { accrualId: input.accrualId, amount: input.amountKopecks },
			},
			tx,
		)

		return payout
	})
}

export async function reverseSalaryPayout(
	payoutId: string,
	comment: string,
	actorId: string,
) {
	const original = await prisma.salaryPayout.findUnique({
		where: { id: payoutId },
		include: { reversals: true, accrual: true },
	})
	validateReversalTarget(original, 'Выплата')

	return prisma.$transaction(async (tx) => {
		const reversal = await tx.salaryPayout.create({
			data: {
				accrualId: original!.accrualId,
				date: new Date(),
				amount: reversalAmount(original!.amount),
				method: original!.method,
				comment,
				createdById: actorId,
				reversalOfId: original!.id,
			},
		})

		await tx.salaryAccrual.update({
			where: { id: original!.accrualId },
			data: { status: 'CONFIRMED' },
		})

		await dispatchDomainEvent(
			{
				actorId,
				action: 'SALARY_PAYOUT_REVERSED',
				entityType: 'SalaryPayout',
				entityId: reversal.id,
				payload: { originalId: original!.id, comment },
			},
			tx,
		)

		return reversal
	})
}

export async function closeMonth(month: string, actorId: string) {
	const existing = await prisma.monthClose.findUnique({ where: { month } })
	if (existing) throw new Error('Месяц уже закрыт')

	return prisma.$transaction(async (tx) => {
		const closed = await tx.monthClose.create({
			data: { month, closedById: actorId },
		})

		await dispatchDomainEvent(
			{
				actorId,
				action: 'MONTH_CLOSED',
				entityType: 'MonthClose',
				entityId: closed.id,
				payload: { month },
			},
			tx,
		)

		return closed
	})
}

export async function adjustTeachingSessionDuration(input: {
	teachingSessionId: string
	adjustedMinutes: number
	reason: string
	actorId: string
}) {
	const session = await prisma.teachingSession.findUnique({
		where: { id: input.teachingSessionId },
		include: { durationAdjustment: true },
	})
	if (!session || !session.endedAt) {
		throw new Error('Урок не найден или не завершён')
	}

	const originalMinutes =
		session.durationAdjustment?.originalMinutes ??
		getSessionDurationMinutes(session) ??
		0

	return prisma.$transaction(async (tx) => {
		const adjustment = await tx.teachingSessionDurationAdjustment.upsert({
			where: { teachingSessionId: input.teachingSessionId },
			create: {
				teachingSessionId: input.teachingSessionId,
				originalMinutes,
				adjustedMinutes: input.adjustedMinutes,
				reason: input.reason,
				adjustedById: input.actorId,
			},
			update: {
				adjustedMinutes: input.adjustedMinutes,
				reason: input.reason,
				adjustedById: input.actorId,
			},
		})

		await dispatchDomainEvent(
			{
				actorId: input.actorId,
				action: 'TEACHING_SESSION_DURATION_ADJUSTED',
				entityType: 'TeachingSession',
				entityId: input.teachingSessionId,
				payload: {
					originalMinutes,
					adjustedMinutes: input.adjustedMinutes,
					reason: input.reason,
				},
			},
			tx,
		)

		return adjustment
	})
}
