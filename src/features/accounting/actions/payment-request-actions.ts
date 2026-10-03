'use server'

import { revalidatePath } from 'next/cache'

import {
	MonthClosedError,
	assertMonthOpenForDate,
} from '@/features/accounting/lib/assert-month-open'
import { toSessionDate } from '@/shared/lib/calendar-date'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { deliverNotifications } from '@/shared/lib/notifications/deliver-notifications'
import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import {
	confirmTuitionPaymentRequestSchema,
	rejectTuitionPaymentRequestSchema,
} from '@/shared/lib/validations/accounting'

export type AccountantPaymentRequestRow = {
	id: string
	createdAt: string
	parentName: string
	parentPhone: string | null
	totalKopecks: number
	lines: Array<{
		studentId: string
		studentName: string
		amountKopecks: number
	}>
}

export async function listPendingTuitionPaymentRequests(): Promise<
	AccountantPaymentRequestRow[]
> {
	await requireRole('ACCOUNTANT')

	const requests = await prisma.tuitionPaymentRequest.findMany({
		where: { status: 'PENDING' },
		include: {
			parent: { select: { name: true, phone: true } },
			lines: {
				include: {
					student: {
						select: {
							id: true,
							fullName: true,
							user: { select: { name: true } },
						},
					},
				},
			},
		},
		orderBy: { createdAt: 'asc' },
	})

	return requests.map((request) => ({
		id: request.id,
		createdAt: request.createdAt.toISOString(),
		parentName: request.parent.name,
		parentPhone: request.parent.phone,
		totalKopecks: request.lines.reduce((sum, line) => sum + line.amount, 0),
		lines: request.lines.map((line) => ({
			studentId: line.studentId,
			studentName: line.student.fullName?.trim() || line.student.user.name,
			amountKopecks: line.amount,
		})),
	}))
}

export type AccountantRequestActionResult =
	| { ok: true }
	| { ok: false; error: string }

export async function confirmTuitionPaymentRequest(
	input: unknown,
): Promise<AccountantRequestActionResult> {
	const session = await requireRole('ACCOUNTANT')
	const parsed = confirmTuitionPaymentRequestSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
	}

	const date = toSessionDate(parsed.data.date)

	try {
		await assertMonthOpenForDate(date)

		await prisma.$transaction(async (tx) => {
			const request = await tx.tuitionPaymentRequest.findUnique({
				where: { id: parsed.data.requestId },
				include: {
					parent: { select: { name: true } },
					lines: true,
				},
			})

			if (!request) {
				throw new Error('Заявка не найдена')
			}
			if (request.status !== 'PENDING') {
				throw new Error('Заявка уже обработана')
			}
			if (request.lines.length === 0) {
				throw new Error('В заявке нет строк')
			}

			const comment = `Заявка родителя: ${request.parent.name}`

			for (const line of request.lines) {
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

				await tx.tuitionPaymentRequestLine.update({
					where: { id: line.id },
					data: { paymentId: payment.id },
				})

				await dispatchDomainEvent(
					{
						actorId: session.user.id,
						action: 'TUITION_PAYMENT_CREATED',
						entityType: 'TuitionPayment',
						entityId: payment.id,
						payload: {
							studentId: line.studentId,
							amount: line.amount,
							method: parsed.data.method,
							requestId: request.id,
						},
					},
					tx,
				)
			}

			await tx.tuitionPaymentRequest.update({
				where: { id: request.id },
				data: {
					status: 'CONFIRMED',
					confirmedById: session.user.id,
					confirmedAt: new Date(),
				},
			})

			await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'TUITION_PAYMENT_REQUEST_CONFIRMED',
					entityType: 'TuitionPaymentRequest',
					entityId: request.id,
					payload: {
						method: parsed.data.method,
						date: parsed.data.date,
						lineCount: request.lines.length,
					},
				},
				tx,
			)
		})
	} catch (error) {
		if (error instanceof MonthClosedError) {
			return { ok: false, error: error.message }
		}
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : 'Не удалось подтвердить заявку',
		}
	}

	revalidatePath('/accounting/payment-requests')
	revalidatePath('/accounting/payments')
	revalidatePath('/parent/pay')
	return { ok: true }
}

export async function rejectTuitionPaymentRequest(
	input: unknown,
): Promise<AccountantRequestActionResult> {
	const session = await requireRole('ACCOUNTANT')
	const parsed = rejectTuitionPaymentRequestSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
	}

	try {
		const notifications = await prisma.$transaction(async (tx) => {
			const request = await tx.tuitionPaymentRequest.findUnique({
				where: { id: parsed.data.requestId },
				select: { id: true, status: true, parentId: true },
			})

			if (!request) {
				throw new Error('Заявка не найдена')
			}
			if (request.status !== 'PENDING') {
				throw new Error('Заявка уже обработана')
			}

			await tx.tuitionPaymentRequest.update({
				where: { id: request.id },
				data: {
					status: 'REJECTED',
					rejectReason: parsed.data.reason,
					confirmedById: session.user.id,
					confirmedAt: new Date(),
				},
			})

			return dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'TUITION_PAYMENT_REQUEST_REJECTED',
					entityType: 'TuitionPaymentRequest',
					entityId: request.id,
					payload: {
						parentId: request.parentId,
						reason: parsed.data.reason,
					},
				},
				tx,
			)
		})

		void deliverNotifications(notifications)
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : 'Не удалось отклонить заявку',
		}
	}

	revalidatePath('/accounting/payment-requests')
	revalidatePath('/parent/pay')
	return { ok: true }
}
