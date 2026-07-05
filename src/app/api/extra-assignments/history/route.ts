import { error, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const studentId = searchParams.get('studentId')
	if (!studentId) return error('studentId обязателен')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
		context: { studentId },
	})
	if ('error' in authResult) return authResult.error

	const instances = await prisma.studentExtraAssignment.findMany({
		where: { studentId },
		include: {
			template: {
				include: {
					author: { select: { id: true, name: true } },
				},
			},
			displayStep: { select: { order: true, title: true } },
			completion: true,
			session: { select: { date: true } },
		},
		orderBy: [{ session: { date: 'desc' } }, { createdAt: 'desc' }],
	})

	return success(
		instances.map((instance) => ({
			id: instance.id,
			createdAt: instance.createdAt.toISOString(),
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
