import {
	error,
	notFound,
	serverError,
	success,
} from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
	const { id } = await context.params

	const instance = await prisma.studentExtraAssignment.findUnique({
		where: { id },
		select: { id: true, studentId: true },
	})
	if (!instance) return notFound('Назначение')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
		context: { studentId: instance.studentId },
	})
	if ('error' in authResult) return authResult.error

	try {
		await prisma.studentExtraAssignment.delete({ where: { id } })
		return success({ deleted: true })
	} catch (err) {
		return serverError(err)
	}
}
