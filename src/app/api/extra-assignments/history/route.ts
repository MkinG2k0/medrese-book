import type { Prisma } from '@/shared/lib/db'
import { error, forbidden, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { extraAssignmentHistoryQuerySchema } from '@/shared/lib/validations/extra-assignment'

function resolveSubject(instance: {
	session: {
		group: {
			subject: { id: string; name: string }
		}
	}
	displayStep: {
		level: {
			subject: { id: string; name: string }
		}
	}
}) {
	return instance.session.group.subject ?? instance.displayStep.level.subject
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const parsed = extraAssignmentHistoryQuerySchema.safeParse({
		studentId: searchParams.get('studentId') ?? undefined,
		subjectId: searchParams.get('subjectId') ?? undefined,
	})
	if (!parsed.success) return error(parsed.error.message)

	const preAuth = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
	})
	if ('error' in preAuth) return preAuth.error

	const { role, studentId: sessionStudentId } = preAuth.session.user
	let studentId: string

	if (role === 'STUDENT') {
		if (!sessionStudentId) return error('Ученик не найден в сессии', 403)
		if (parsed.data.studentId && parsed.data.studentId !== sessionStudentId) {
			return forbidden()
		}
		studentId = sessionStudentId
	} else {
		if (!parsed.data.studentId) return error('studentId обязателен')
		studentId = parsed.data.studentId
	}

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
		context: { studentId },
	})
	if ('error' in authResult) return authResult.error

	const where: Prisma.StudentExtraAssignmentWhereInput = {
		studentId,
		...(parsed.data.subjectId
			? {
					OR: [
						{ session: { group: { subjectId: parsed.data.subjectId } } },
						{ displayStep: { level: { subjectId: parsed.data.subjectId } } },
					],
				}
			: {}),
	}

	const instances = await prisma.studentExtraAssignment.findMany({
		where,
		include: {
			template: {
				include: {
					author: { select: { id: true, name: true } },
				},
			},
			displayStep: {
				select: {
					order: true,
					title: true,
					level: {
						select: {
							subjectId: true,
							subject: { select: { id: true, name: true } },
						},
					},
				},
			},
			completion: true,
			session: {
				select: {
					date: true,
					group: {
						select: {
							subjectId: true,
							subject: { select: { id: true, name: true } },
						},
					},
				},
			},
		},
		orderBy: [{ session: { date: 'desc' } }, { createdAt: 'desc' }],
	})

	return success(
		instances.map((instance) => ({
			id: instance.id,
			createdAt: instance.createdAt.toISOString(),
			subject: resolveSubject(instance),
			displayStep: {
				order: instance.displayStep.order,
				title: instance.displayStep.title,
			},
			template: {
				title: instance.template.title,
				author: instance.template.author,
			},
			completion: instance.completion
				? {
						id: instance.completion.id,
						grade: instance.completion.grade,
						note: instance.completion.note,
						gradedAt: instance.completion.gradedAt.toISOString(),
						createdAt: instance.completion.createdAt.toISOString(),
					}
				: null,
			session: {
				date: instance.session.date.toISOString(),
			},
		})),
	)
}
