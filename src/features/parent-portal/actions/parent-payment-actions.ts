'use server'

import { getLocalDateString } from '@/shared/lib/calendar-date'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import { createTuitionPaymentRequestSchema } from '@/shared/lib/validations/accounting'

export type ParentPaymentChild = {
	studentId: string
	name: string
	tuitionRateKopecks: number
	groupNames: string[]
}

export type ParentPaymentRequestSummary = {
	id: string
	status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
	createdAt: string
	rejectReason: string | null
	totalKopecks: number
	lines: Array<{
		studentId: string
		studentName: string
		amountKopecks: number
	}>
}

export type ParentPaymentPageData = {
	parentUserId: string
	children: ParentPaymentChild[]
	requests: ParentPaymentRequestSummary[]
}

export async function getParentPaymentPageData(): Promise<ParentPaymentPageData> {
	const session = await requireRole('PARENT')

	const [children, requests] = await Promise.all([
		prisma.student.findMany({
			where: {
				parentId: session.user.id,
				status: 'ACTIVE',
			},
			select: {
				id: true,
				fullName: true,
				tuitionRate: true,
				user: { select: { name: true } },
				enrollments: {
					select: { group: { select: { name: true } } },
					orderBy: { enrolledAt: 'asc' },
				},
			},
			orderBy: { user: { name: 'asc' } },
		}),
		prisma.tuitionPaymentRequest.findMany({
			where: { parentId: session.user.id },
			include: {
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
			orderBy: { createdAt: 'desc' },
			take: 20,
		}),
	])

	return {
		parentUserId: session.user.id,
		children: children.map((child) => ({
			studentId: child.id,
			name: child.fullName?.trim() || child.user.name,
			tuitionRateKopecks: child.tuitionRate,
			groupNames: child.enrollments.map((enrollment) => enrollment.group.name),
		})),
		requests: requests.map((request) => ({
			id: request.id,
			status: request.status,
			createdAt: request.createdAt.toISOString(),
			rejectReason: request.rejectReason,
			totalKopecks: request.lines.reduce((sum, line) => sum + line.amount, 0),
			lines: request.lines.map((line) => ({
				studentId: line.studentId,
				studentName: line.student.fullName?.trim() || line.student.user.name,
				amountKopecks: line.amount,
			})),
		})),
	}
}

export type SubmitParentPaymentResult =
	| { ok: true; requestId: string }
	| { ok: false; error: string }

export async function submitParentPaymentRequest(
	input: unknown,
): Promise<SubmitParentPaymentResult> {
	const session = await requireRole('PARENT')

	const parsed = createTuitionPaymentRequestSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
	}

	const studentIds = [...new Set(parsed.data.lines.map((line) => line.studentId))]
	if (studentIds.length !== parsed.data.lines.length) {
		return { ok: false, error: 'В заявке не должно быть дублей детей' }
	}

	const children = await prisma.student.findMany({
		where: {
			id: { in: studentIds },
			parentId: session.user.id,
			status: 'ACTIVE',
		},
		select: { id: true },
	})

	if (children.length !== studentIds.length) {
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
					lines: {
						create: parsed.data.lines.map((line) => ({
							studentId: line.studentId,
							amount: line.amountKopecks,
						})),
					},
				},
				select: { id: true },
			})

			await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'TUITION_PAYMENT_REQUEST_CREATED',
					entityType: 'TuitionPaymentRequest',
					entityId: created.id,
					payload: {
						parentId: session.user.id,
						lines: parsed.data.lines,
						date: getLocalDateString(),
					},
				},
				tx,
			)

			return created
		})

		return { ok: true, requestId: request.id }
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: 'Не удалось отправить заявку',
		}
	}
}
