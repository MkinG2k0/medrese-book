import { computeStudentBalanceKopecks } from '@/features/accounting/lib/compute-student-balance'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import {
	isLastCalendarDayInMoscow,
	moscowMonthKey,
	moscowMonthLabel,
} from '@/shared/lib/moscow-date'
import type { Notification, Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'

export type TuitionReminderStudent = {
	parentId: string | null
	tuitionCharges: Array<{ amount: number }>
	tuitionPayments: Array<{ amount: number }>
}

export type SendTuitionRemindersResult = {
	month: string
	lastDay: boolean
	eligibleParentIds: string[]
	created: number
	skippedExisting: number
	notifications: Notification[]
}

export function collectParentIdsWithActiveChildDebt(
	students: TuitionReminderStudent[],
): string[] {
	const parentIds = new Set<string>()

	for (const student of students) {
		if (!student.parentId) continue
		const totalCharges = student.tuitionCharges.reduce(
			(sum, charge) => sum + charge.amount,
			0,
		)
		const totalPayments = student.tuitionPayments.reduce(
			(sum, payment) => sum + payment.amount,
			0,
		)
		if (computeStudentBalanceKopecks(totalPayments, totalCharges) < 0) {
			parentIds.add(student.parentId)
		}
	}

	return [...parentIds]
}

function reminderMonthFromPayload(payload: unknown): string | null {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return null
	}
	const month = (payload as { month?: unknown }).month
	return typeof month === 'string' ? month : null
}

export async function sendTuitionReminders(
	now: Date = new Date(),
	tx?: Prisma.TransactionClient,
): Promise<SendTuitionRemindersResult> {
	const client = tx ?? prisma
	const month = moscowMonthKey(now)
	const empty: SendTuitionRemindersResult = {
		month,
		lastDay: false,
		eligibleParentIds: [],
		created: 0,
		skippedExisting: 0,
		notifications: [],
	}

	if (!isLastCalendarDayInMoscow(now)) {
		return empty
	}

	const students = await client.student.findMany({
		where: {
			status: 'ACTIVE',
			parentId: { not: null },
		},
		select: {
			parentId: true,
			tuitionCharges: { select: { amount: true } },
			tuitionPayments: { select: { amount: true } },
		},
	})

	const eligibleParentIds = collectParentIdsWithActiveChildDebt(students)
	if (eligibleParentIds.length === 0) {
		return { ...empty, lastDay: true }
	}

	const existing = await client.notification.findMany({
		where: {
			type: 'TUITION_PAYMENT_REMINDER',
			userId: { in: eligibleParentIds },
		},
		select: { userId: true, payload: true },
	})

	const alreadyNotified = new Set(
		existing
			.filter((row) => reminderMonthFromPayload(row.payload) === month)
			.map((row) => row.userId),
	)
	const parentIds = eligibleParentIds.filter((id) => !alreadyNotified.has(id))

	if (parentIds.length === 0) {
		return {
			month,
			lastDay: true,
			eligibleParentIds,
			created: 0,
			skippedExisting: alreadyNotified.size,
			notifications: [],
		}
	}

	const notifications = await dispatchDomainEvent(
		{
			actorId: 'system',
			action: 'TUITION_PAYMENT_REMINDER',
			entityType: 'TuitionPaymentReminder',
			entityId: month,
			payload: {
				month,
				monthLabel: moscowMonthLabel(now),
				parentIds,
			},
		},
		tx,
	)

	return {
		month,
		lastDay: true,
		eligibleParentIds,
		created: notifications.length,
		skippedExisting: alreadyNotified.size,
		notifications,
	}
}
