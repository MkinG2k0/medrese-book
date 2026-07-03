'use server'

import {
	buildTeacherLessonAnalyticsRows,
	getTeacherLessonsQueryBounds,
	parseTeacherLessonsDateRange,
	type TeacherLessonAnalyticsRow,
} from '@/features/analytics/lib/teacher-lessons-analytics'
import { teachingSessionDate } from '@/features/journal/lib/teaching-session-queries'
import { prisma } from '@/shared/lib/prisma'
import { isSameCalendarDay } from '@/shared/lib/calendar-date'
import { calendarDateAndTimeToDate } from '@/shared/lib/local-time'
import { requireRole, requireRoles } from '@/shared/lib/session'
import {
	clearTeacherLessonTimeSchema,
	updateTeacherLessonTimeSchema,
} from '@/shared/lib/validations/teacher-lesson-time'
import { revalidatePath } from 'next/cache'

async function fetchTeacherLessonAnalytics(
	teacherId: string | null | undefined,
	fromParam?: string,
	toParam?: string,
): Promise<{
	rows: TeacherLessonAnalyticsRow[]
	from: string
	to: string
	isRange: boolean
}> {
	const { from, to } = parseTeacherLessonsDateRange(fromParam, toParam)
	const { start, end } = getTeacherLessonsQueryBounds(from, to)
	const isRange = from !== to

	const teachers = await prisma.teacher.findMany({
		where: teacherId ? { id: teacherId } : undefined,
		include: { user: { select: { id: true, name: true } } },
		orderBy: { user: { name: 'asc' } },
	})

	const teacherIds = teachers.map((teacher) => teacher.id)
	const userIds = teachers.map((teacher) => teacher.userId)

	if (teacherIds.length === 0) {
		return { rows: [], from, to, isRange }
	}

	const [sessions, logins, logouts] = await Promise.all([
		prisma.teachingSession.findMany({
			where: {
				teacherId: { in: teacherIds },
				OR: [
					{ startedAt: { gte: start, lte: end } },
					{ date: { gte: start, lte: end } },
				],
			},
			select: {
				id: true,
				teacherId: true,
				startedAt: true,
				endedAt: true,
				date: true,
			},
		}),
		prisma.auditEvent.findMany({
			where: {
				action: 'USER_LOGIN',
				actorId: { in: userIds },
				createdAt: { gte: start, lte: end },
			},
			select: {
				id: true,
				actorId: true,
				createdAt: true,
			},
			orderBy: { createdAt: 'asc' },
		}),
		prisma.auditEvent.findMany({
			where: {
				action: 'USER_LOGOUT',
				actorId: { in: userIds },
				createdAt: { gte: start, lte: end },
			},
			select: {
				id: true,
				actorId: true,
				createdAt: true,
			},
			orderBy: { createdAt: 'asc' },
		}),
	])

	const rows = buildTeacherLessonAnalyticsRows(
		teachers.map((teacher) => ({
			id: teacher.id,
			userId: teacher.userId,
			name: teacher.user.name,
		})),
		sessions,
		logins.map((login) => ({
			id: login.id,
			userId: login.actorId,
			createdAt: login.createdAt,
		})),
		logouts.map((logout) => ({
			id: logout.id,
			userId: logout.actorId,
			createdAt: logout.createdAt,
		})),
		from,
		to,
	)

	return { rows, from, to, isRange }
}

export async function getTeacherLessonAnalytics(
	fromParam?: string,
	toParam?: string,
	teacherId?: string | null,
): Promise<{
	rows: TeacherLessonAnalyticsRow[]
	from: string
	to: string
	isRange: boolean
}> {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return fetchTeacherLessonAnalytics(teacherId, fromParam, toParam)
}

export async function getMyTeacherHoursAnalytics(
	fromParam?: string,
	toParam?: string,
): Promise<{
	rows: TeacherLessonAnalyticsRow[]
	from: string
	to: string
	isRange: boolean
}> {
	const session = await requireRole('TEACHER')
	return fetchTeacherLessonAnalytics(
		session.user.teacherId,
		fromParam,
		toParam,
	)
}

function findLastAuditEventForDay<
	T extends { createdAt: Date },
>(records: T[], day: string): T | undefined {
	let last: T | undefined
	for (const record of records) {
		if (isSameCalendarDay(record.createdAt, day)) {
			last = record
		}
	}
	return last
}

async function findDayTeachingSession(teacherId: string, day: string) {
	const { start, end } = getTeacherLessonsQueryBounds(day, day)
	const sessions = await prisma.teachingSession.findMany({
		where: {
			teacherId,
			OR: [
				{ startedAt: { gte: start, lte: end } },
				{ date: { gte: start, lte: end } },
			],
		},
		select: { id: true, startedAt: true, endedAt: true, date: true },
	})

	return sessions.find(
		(session) =>
			isSameCalendarDay(session.date, day) ||
			isSameCalendarDay(session.startedAt, day),
	)
}

export async function updateTeacherLessonTime(
	input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const parsed = updateTeacherLessonTimeSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
	}

	const { teacherId, date, field, time } = parsed.data

	let timestamp: Date
	try {
		timestamp = calendarDateAndTimeToDate(date, time)
	} catch {
		return { ok: false, error: 'Некорректное время' }
	}

	const teacher = await prisma.teacher.findUnique({
		where: { id: teacherId },
		include: { user: { select: { id: true, role: true } } },
	})
	if (!teacher) {
		return { ok: false, error: 'Учитель не найден' }
	}

	const { start, end } = getTeacherLessonsQueryBounds(date, date)

	try {
		if (field === 'login' || field === 'logout') {
			const action = field === 'login' ? 'USER_LOGIN' : 'USER_LOGOUT'
			const events = await prisma.auditEvent.findMany({
				where: {
					action,
					actorId: teacher.userId,
					createdAt: { gte: start, lte: end },
				},
				orderBy: { createdAt: 'asc' },
			})

			const existing =
				field === 'login'
					? events.find((event) => isSameCalendarDay(event.createdAt, date))
					: findLastAuditEventForDay(events, date)

			if (existing) {
				await prisma.auditEvent.update({
					where: { id: existing.id },
					data: { createdAt: timestamp },
				})
			} else {
				await prisma.auditEvent.create({
					data: {
						actorId: teacher.userId,
						action,
						entityType: 'User',
						entityId: teacher.userId,
						payload: {
							role: teacher.user.role,
							correctedByManager: true,
							...(field === 'login'
								? { loggedInAt: timestamp.toISOString() }
								: { loggedOutAt: timestamp.toISOString() }),
						},
						createdAt: timestamp,
					},
				})
			}
		} else {
			const session = await findDayTeachingSession(teacherId, date)

			if (field === 'lessonStart') {
				if (session) {
					if (session.endedAt && timestamp >= session.endedAt) {
						return {
							ok: false,
							error: 'Начало урока должно быть раньше конца',
						}
					}
					await prisma.teachingSession.update({
						where: { id: session.id },
						data: { startedAt: timestamp },
					})
				} else {
					const group = await prisma.group.findFirst({
						where: { teacherId },
						select: { id: true },
					})
					if (!group) {
						return { ok: false, error: 'У учителя нет группы' }
					}
					await prisma.teachingSession.create({
						data: {
							teacherId,
							groupId: group.id,
							date: teachingSessionDate(date),
							startedAt: timestamp,
						},
					})
				}
			} else {
				if (!session) {
					return { ok: false, error: 'Сначала укажите начало урока' }
				}
				if (timestamp <= session.startedAt) {
					return {
						ok: false,
						error: 'Конец урока должен быть позже начала',
					}
				}
				await prisma.teachingSession.update({
					where: { id: session.id },
					data: { endedAt: timestamp },
				})
			}
		}
	} catch {
		return { ok: false, error: 'Не удалось сохранить время' }
	}

	revalidatePath('/analytics/teachers')
	return { ok: true }
}

export async function clearTeacherLessonTime(
	input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const parsed = clearTeacherLessonTimeSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
	}

	const { teacherId, date, field } = parsed.data

	const teacher = await prisma.teacher.findUnique({
		where: { id: teacherId },
		select: { id: true, userId: true },
	})
	if (!teacher) {
		return { ok: false, error: 'Учитель не найден' }
	}

	const { start, end } = getTeacherLessonsQueryBounds(date, date)

	try {
		if (field === 'login' || field === 'logout') {
			const action = field === 'login' ? 'USER_LOGIN' : 'USER_LOGOUT'
			const events = await prisma.auditEvent.findMany({
				where: {
					action,
					actorId: teacher.userId,
					createdAt: { gte: start, lte: end },
				},
				orderBy: { createdAt: 'asc' },
			})

			const existing =
				field === 'login'
					? events.find((event) => isSameCalendarDay(event.createdAt, date))
					: findLastAuditEventForDay(events, date)

			if (!existing) {
				return { ok: false, error: 'Время не задано' }
			}

			await prisma.auditEvent.delete({ where: { id: existing.id } })
		} else {
			const session = await findDayTeachingSession(teacherId, date)
			if (!session) {
				return { ok: false, error: 'Время не задано' }
			}

			if (field === 'lessonEnd') {
				if (!session.endedAt) {
					return { ok: false, error: 'Время не задано' }
				}
				await prisma.teachingSession.update({
					where: { id: session.id },
					data: { endedAt: null },
				})
			} else {
				if (session.endedAt) {
					return { ok: false, error: 'Сначала удалите конец урока' }
				}
				await prisma.teachingSession.delete({ where: { id: session.id } })
			}
		}
	} catch {
		return { ok: false, error: 'Не удалось удалить время' }
	}

	revalidatePath('/analytics/teachers')
	return { ok: true }
}
