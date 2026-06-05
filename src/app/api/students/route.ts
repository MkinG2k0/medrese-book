import { startOfDay, endOfDay } from 'date-fns'

import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { error, forbidden, success, unauthorized } from '@/shared/api'

export async function GET(request: Request) {
	const session = await auth()
	if (!session) return unauthorized()

	const { searchParams } = new URL(request.url)
	const groupId = searchParams.get('groupId')
	const dateStr = searchParams.get('date')

	if (!groupId) return error('groupId обязателен')

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			students: {
				include: {
					user: true,
					...(dateStr
						? {
								sessions: {
									where: {
										date: {
											gte: startOfDay(new Date(dateStr)),
											lte: endOfDay(new Date(dateStr)),
										},
									},
								},
							}
						: {}),
				},
			},
		},
	})

	if (!group) return error('Группа не найдена', 404)

	if (
		session.user.role === 'TEACHER' &&
		session.user.teacherId !== group.teacherId
	) {
		return forbidden()
	}

	const students = group.students.map((s) => ({
		id: s.id,
		name: s.user.name,
		currentStepIdx: s.currentStepIdx,
		groupId: s.groupId,
		hasSessionToday:
			dateStr && 'sessions' in s
				? (s as typeof s & { sessions: unknown[] }).sessions.length > 0
				: false,
	}))

	return success(students)
}
