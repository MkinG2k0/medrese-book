import { error, notFound, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import type { StepContent } from '@/shared/lib/validations/step'

type RouteContext = { params: Promise<{ stepId: string }> }

export async function GET(_request: Request, context: RouteContext) {
	const { stepId } = await context.params
	if (!stepId) return error('stepId обязателен')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const step = await prisma.step.findUnique({
		where: { id: stepId },
		select: { content: true, teacherNote: true, pdfUrl: true },
	})

	if (!step) return notFound('Шаг')

	return success({
		content: step.content as StepContent,
		teacherNote: step.teacherNote as StepContent,
		pdfUrl: step.pdfUrl,
	})
}
