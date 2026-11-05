'use server'

import { getLocalDateString } from '@/shared/lib/calendar-date'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { deliverNotifications } from '@/shared/lib/notifications/deliver-notifications'
import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import { createTuitionPaymentRequestSchema } from '@/shared/lib/validations/accounting'

export type SubmitParentPaymentResult =
	| { ok: true; requestId: string }
	| { ok: false; error: string }

export async function submitParentPaymentRequest(
	input: unknown,
): Promise<SubmitParentPaymentResult> {
	const session = await requireRole('PARENT')

	const parsed = createTuitionPaymentRequestSchema.safeParse(input)
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? 'Некорректные данные',
		}
	}

	const studentIds = [
		...new Set(parsed.data.lines.map((line) => line.studentId)),
	]
	if (studentIds.length !== parsed.data.lines.length) {
		return { ok: false, error: 'В заявке не должно быть дублей детей' }
	}

	const owned = await prisma.student.findMany({
		where: {
			id: { in: studentIds },
			parentId: session.user.id,
			status: 'ACTIVE',
		},
		select: { id: true },
	})

	if (owned.length !== studentIds.length) {
		return {
			ok: false,
			error: 'Можно оплатить только своих активных детей',
		}
	}

	try {
		const request = await prisma.$transaction(async (tx) => {
			const created = await tx.tuitionPaymentRequest.create({
				data: {
					parentId: session.user.id,
					status: 'PENDING',
					month: parsed.data.month,
					lines: {
						create: parsed.data.lines.map((line) => ({
							studentId: line.studentId,
							amount: line.amountKopecks,
						})),
					},
				},
				select: { id: true },
			})

			const notifications = await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'TUITION_PAYMENT_REQUEST_CREATED',
					entityType: 'TuitionPaymentRequest',
					entityId: created.id,
					payload: {
						parentId: session.user.id,
						month: parsed.data.month,
						lines: parsed.data.lines,
						date: getLocalDateString(),
					},
				},
				tx,
			)

			return { created, notifications }
		})

		void deliverNotifications(request.notifications)
		return { ok: true, requestId: request.created.id }
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : 'Не удалось отправить заявку',
		}
	}
}
