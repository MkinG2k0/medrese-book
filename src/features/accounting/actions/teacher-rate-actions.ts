'use server'

import { revalidatePath } from 'next/cache'

import { recalculateSalaryAccrualDraft } from '@/features/accounting/lib/salary-accrual'
import {
	withCurrentRateFlag,
	type TeacherRateHistoryItem,
} from '@/features/accounting/lib/teacher-rate-history'
import { getLocalDateString, toSessionDate } from '@/shared/lib/calendar-date'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import { requireRole, requireRoles } from '@/shared/lib/session'
import { setTeacherRateSchema } from '@/shared/lib/validations/accounting'

export type TeacherRateView = {
	teacherId: string
	teacherName: string
	current: TeacherRateHistoryItem | null
	history: TeacherRateHistoryItem[]
}

async function loadTeacherRateView(
	teacherId: string,
): Promise<TeacherRateView | null> {
	const teacher = await prisma.teacher.findUnique({
		where: { id: teacherId },
		select: {
			id: true,
			user: { select: { name: true } },
			teacherRates: {
				orderBy: { validFrom: 'desc' },
				select: { id: true, hourlyRate: true, validFrom: true },
			},
		},
	})

	if (!teacher) return null

	const today = getLocalDateString()
	const history = withCurrentRateFlag(
		teacher.teacherRates.map((rate) => ({
			id: rate.id,
			hourlyRateKopecks: rate.hourlyRate,
			validFrom: getLocalDateString(rate.validFrom),
		})),
		today,
	)

	return {
		teacherId: teacher.id,
		teacherName: teacher.user.name,
		current: history.find((rate) => rate.isCurrent) ?? null,
		history,
	}
}

export async function getTeacherRateView(
	teacherId: string,
): Promise<TeacherRateView | null> {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return loadTeacherRateView(teacherId)
}

export async function getOwnTeacherRateView(): Promise<TeacherRateView | null> {
	const session = await requireRole('TEACHER')
	if (!session.user.teacherId) return null
	return loadTeacherRateView(session.user.teacherId)
}

export async function setTeacherRate(
	input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const session = await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const parsed = setTeacherRateSchema.safeParse(input)
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? 'Некорректные данные',
		}
	}

	const { teacherId, hourlyRateKopecks, validFrom } = parsed.data

	const teacher = await prisma.teacher.findUnique({
		where: { id: teacherId },
		select: { id: true },
	})
	if (!teacher) {
		return { ok: false, error: 'Учитель не найден' }
	}

	const validFromDate = toSessionDate(validFrom)

	try {
		await prisma.$transaction(async (tx) => {
			const existingRates = await tx.teacherRate.findMany({
				where: { teacherId },
				select: { id: true, validFrom: true },
			})
			const sameDay = existingRates.find(
				(rate) => getLocalDateString(rate.validFrom) === validFrom,
			)

			const rate = sameDay
				? await tx.teacherRate.update({
						where: { id: sameDay.id },
						data: { hourlyRate: hourlyRateKopecks, validFrom: validFromDate },
					})
				: await tx.teacherRate.create({
						data: {
							teacherId,
							hourlyRate: hourlyRateKopecks,
							validFrom: validFromDate,
						},
					})

			const draftAccruals = await tx.salaryAccrual.findMany({
				where: { teacherId, status: 'DRAFT' },
				select: { month: true },
			})
			for (const accrual of draftAccruals) {
				await recalculateSalaryAccrualDraft(teacherId, accrual.month, tx)
			}

			await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'TEACHER_RATE_SET',
					entityType: 'TeacherRate',
					entityId: rate.id,
					payload: {
						teacherId,
						hourlyRateKopecks,
						validFrom,
					},
				},
				tx,
			)
		})
	} catch {
		return { ok: false, error: 'Не удалось сохранить ставку' }
	}

	revalidatePath('/analytics/teachers')
	revalidatePath('/accounting/salaries')
	revalidatePath('/accounting/my-salary')
	return { ok: true }
}
