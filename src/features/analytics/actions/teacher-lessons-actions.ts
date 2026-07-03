'use server'

import {
	buildTeacherLessonAnalyticsRows,
	getTeacherLessonsQueryBounds,
	parseTeacherLessonsDateRange,
	type TeacherLessonAnalyticsRow,
} from '@/features/analytics/lib/teacher-lessons-analytics'
import { prisma } from '@/shared/lib/prisma'
import { requireRole, requireRoles } from '@/shared/lib/session'

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
			userId: login.actorId,
			createdAt: login.createdAt,
		})),
		logouts.map((logout) => ({
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
