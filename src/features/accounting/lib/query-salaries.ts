import { monthKeyToDateRange } from '@/shared/lib/accounting/month'
import { prisma } from '@/shared/lib/prisma'

import { recalculateSalaryAccrualDraft } from './salary-accrual'
import {
	countUnresolvedAnomalies,
	getSessionDurationMinutes,
	isSessionAnomaly,
} from './teacher-hours'

export type SalaryRow = {
	accrualId: string
	teacherId: string
	teacherName: string
	totalMinutes: number
	hoursLabel: string
	anomalyCount: number
	hourlyRateKopecks: number | null
	amountKopecks: number
	status: 'DRAFT' | 'CONFIRMED' | 'PAID'
}

export type TeacherLessonRow = {
	sessionId: string
	date: string
	startedAt: string
	endedAt: string | null
	durationMinutes: number | null
	isAnomaly: boolean
	isAdjusted: boolean
	groupName: string
}

function formatHours(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60
	if (minutes === 0) return `${hours} ч`
	return `${hours} ч ${minutes} мин`
}

export async function querySalariesForMonth(month: string): Promise<SalaryRow[]> {
	const teachers = await prisma.teacher.findMany({
		include: { user: { select: { name: true } } },
		orderBy: { user: { name: 'asc' } },
	})

	const rows: SalaryRow[] = []
	for (const teacher of teachers) {
		const accrual = await recalculateSalaryAccrualDraft(teacher.id, month)
		const { start, end } = monthKeyToDateRange(month)
		const sessions = await prisma.teachingSession.findMany({
			where: {
				teacherId: teacher.id,
				date: { gte: start, lte: end },
				endedAt: { not: null },
			},
			include: { durationAdjustment: true },
		})
		const latestRate = await prisma.teacherRate.findFirst({
			where: { teacherId: teacher.id, validFrom: { lte: end } },
			orderBy: { validFrom: 'desc' },
		})

		rows.push({
			accrualId: accrual.id,
			teacherId: teacher.id,
			teacherName: teacher.user.name,
			totalMinutes: accrual.totalMinutes,
			hoursLabel: formatHours(accrual.totalMinutes),
			anomalyCount: countUnresolvedAnomalies(sessions),
			hourlyRateKopecks: latestRate?.hourlyRate ?? 0,
			amountKopecks: accrual.amount,
			status: accrual.status,
		})
	}

	return rows
}

export async function queryTeacherLessonsForMonth(
	teacherId: string,
	month: string,
): Promise<TeacherLessonRow[]> {
	const { start, end } = monthKeyToDateRange(month)
	const sessions = await prisma.teachingSession.findMany({
		where: {
			teacherId,
			date: { gte: start, lte: end },
			endedAt: { not: null },
		},
		include: {
			group: { select: { name: true } },
			durationAdjustment: true,
		},
		orderBy: { startedAt: 'asc' },
	})

	return sessions.map((session) => ({
		sessionId: session.id,
		date: session.date.toISOString(),
		startedAt: session.startedAt.toISOString(),
		endedAt: session.endedAt?.toISOString() ?? null,
		durationMinutes: getSessionDurationMinutes(session),
		isAnomaly: isSessionAnomaly(session),
		isAdjusted: session.durationAdjustment != null,
		groupName: session.group.name,
	}))
}

export async function queryTeacherOwnSalary(
	teacherId: string,
	month: string,
) {
	const accrual = await prisma.salaryAccrual.findUnique({
		where: { teacherId_month: { teacherId, month } },
		include: { payouts: true },
	})
	if (!accrual) {
		return {
			month,
			totalMinutes: 0,
			amountKopecks: 0,
			status: 'DRAFT' as const,
			paidKopecks: 0,
		}
	}
	const paidKopecks = accrual.payouts.reduce((sum, p) => sum + p.amount, 0)
	return {
		month,
		totalMinutes: accrual.totalMinutes,
		amountKopecks: accrual.amount,
		status: accrual.status,
		paidKopecks,
	}
}
