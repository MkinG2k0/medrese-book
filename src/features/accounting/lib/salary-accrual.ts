import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import { monthKeyToDateRange } from '@/shared/lib/accounting/month'
import { calcSalaryAmountKopecks } from '@/shared/lib/money'

import {
	calcWeightedSalaryKopecks,
	countUnresolvedAnomalies,
	type TeachingSessionWithAdjustment,
} from './teacher-hours'

export class SalaryAccrualBlockedError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'SalaryAccrualBlockedError'
	}
}

async function loadTeacherSessionsForMonth(
	teacherId: string,
	month: string,
	tx?: Prisma.TransactionClient,
): Promise<TeachingSessionWithAdjustment[]> {
	const client = tx ?? prisma
	const { start, end } = monthKeyToDateRange(month)
	return client.teachingSession.findMany({
		where: {
			teacherId,
			date: { gte: start, lte: end },
			endedAt: { not: null },
		},
		include: { durationAdjustment: true },
		orderBy: { startedAt: 'asc' },
	})
}

export async function recalculateSalaryAccrualDraft(
	teacherId: string,
	month: string,
	tx?: Prisma.TransactionClient,
) {
	const client = tx ?? prisma
	const sessions = await loadTeacherSessionsForMonth(teacherId, month, client)
	const rates = await client.teacherRate.findMany({
		where: { teacherId },
		orderBy: { validFrom: 'asc' },
	})
	const { totalMinutes, amount } = calcWeightedSalaryKopecks(sessions, rates)

	return client.salaryAccrual.upsert({
		where: { teacherId_month: { teacherId, month } },
		create: {
			teacherId,
			month,
			totalMinutes,
			amount,
			status: 'DRAFT',
		},
		update: {
			totalMinutes,
			amount,
		},
	})
}

export async function confirmSalaryAccrual(
	accrualId: string,
	tx?: Prisma.TransactionClient,
) {
	const client = tx ?? prisma
	const accrual = await client.salaryAccrual.findUnique({
		where: { id: accrualId },
	})
	if (!accrual) throw new SalaryAccrualBlockedError('Начисление не найдено')
	if (accrual.status !== 'DRAFT') {
		throw new SalaryAccrualBlockedError('Можно подтвердить только черновик')
	}

	const sessions = await loadTeacherSessionsForMonth(
		accrual.teacherId,
		accrual.month,
		client,
	)
	const anomalies = countUnresolvedAnomalies(sessions)
	if (anomalies > 0) {
		throw new SalaryAccrualBlockedError(
			`Есть ${anomalies} урок(ов) с аномальной длительностью — скорректируйте или проверьте`,
		)
	}

	return client.salaryAccrual.update({
		where: { id: accrualId },
		data: { status: 'CONFIRMED' },
	})
}

export async function markSalaryAccrualPaid(accrualId: string) {
	const accrual = await prisma.salaryAccrual.findUnique({
		where: { id: accrualId },
		include: { payouts: true },
	})
	if (!accrual) throw new SalaryAccrualBlockedError('Начисление не найдено')
	if (accrual.status !== 'CONFIRMED') {
		throw new SalaryAccrualBlockedError('Выплата возможна только после подтверждения')
	}

	const paid = accrual.payouts.reduce((sum, p) => sum + p.amount, 0)
	if (paid < accrual.amount) {
		throw new SalaryAccrualBlockedError('Сумма выплат меньше начисления')
	}

	return prisma.salaryAccrual.update({
		where: { id: accrualId },
		data: { status: 'PAID' },
	})
}

export function previewSalaryFromMinutes(
	totalMinutes: number,
	hourlyRateKopecks: number,
) {
	return calcSalaryAmountKopecks(totalMinutes, hourlyRateKopecks)
}
