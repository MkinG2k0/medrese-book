import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { serializeTeachingSession } from '@/features/journal/lib/teaching-session'
import { resolveTeachingSessionStart } from '@/features/journal/lib/teaching-session-start'
import {
	endTeachingSessionById,
	findActiveTeachingSession,
	findTeachingSessionForDay,
	teachingSessionDate,
} from '@/features/journal/lib/teaching-session-queries'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import {
	getLocalDateString,
} from '@/shared/lib/calendar-date'
import { prisma } from '@/shared/lib/prisma'
import {
	startTeachingSessionSchema,
	teachingSessionQuerySchema,
} from '@/shared/lib/validations/teaching-session'
import { created, error, success } from '@/shared/api'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const parsed = teachingSessionQuerySchema.safeParse({
		groupId: searchParams.get('groupId'),
		date: searchParams.get('date'),
	})
	if (!parsed.success) return error(parsed.error.message)

	const { groupId, date } = parsed.data
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER'],
		context: { groupId },
	})
	if ('error' in authResult) return authResult.error

	const teacherId = authResult.session.user.teacherId!
	const session = await findTeachingSessionForDay(teacherId, groupId, date)

	return success(session ? serializeTeachingSession(session) : null)
}

export async function POST(request: Request) {
	const body = await request.json()
	const parsed = startTeachingSessionSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	const { groupId, date } = parsed.data
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER'],
		context: { groupId },
	})
	if ('error' in authResult) return authResult.error

	const teacherId = authResult.session.user.teacherId!
	const today = getLocalDateString()
	if (date !== today) {
		return error('Начать урок можно только за сегодняшний день')
	}

	const existing = await findTeachingSessionForDay(teacherId, groupId, date)
	const startDecision = resolveTeachingSessionStart(existing)
	if (startDecision.action === 'resume') {
		return success(serializeTeachingSession(existing!))
	}
	if (startDecision.action === 'already_ended') {
		return error('Урок на этот день уже завершён')
	}

	const activeElsewhere = await findActiveTeachingSession(teacherId)
	if (activeElsewhere) {
		const activeDay = getLocalDateString(activeElsewhere.startedAt)
		if (activeDay !== date || activeElsewhere.groupId !== groupId) {
			await endTeachingSessionById(activeElsewhere.id)
		}
	}

	const startedAt = new Date()
	const saved = await prisma.$transaction(async (tx) => {
		const teachingSession = await tx.teachingSession.create({
			data: {
				teacherId,
				groupId,
				date: teachingSessionDate(date),
				startedAt,
			},
		})

		await dispatchDomainEvent(
			{
				actorId: authResult.session.user.id,
				action: 'LESSON_STARTED',
				entityType: 'TeachingSession',
				entityId: teachingSession.id,
				payload: {
					groupId,
					date,
					startedAt: startedAt.toISOString(),
				},
			},
			tx,
		)

		return teachingSession
	})

	return created(serializeTeachingSession(saved))
}
