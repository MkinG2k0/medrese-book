import {
	error,
	notFound,
	serverError,
	success,
} from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { updateExtraAssignmentSchema } from '@/shared/lib/validations/extra-assignment'
import type { StepContent } from '@/shared/lib/validations/step'

const templateInclude = {
	author: { select: { id: true, name: true } },
	step: {
		select: {
			id: true,
			order: true,
			title: true,
			levelId: true,
			level: { select: { number: true, title: true } },
		},
	},
} as const

function serializeTemplate(template: {
	id: string
	title: string
	content: unknown
	stepId: string | null
	authorId: string
	isSystem: boolean
	createdAt: Date
	updatedAt: Date
	author: { id: string; name: string }
	step: {
		id: string
		order: number
		title: string
		levelId: string
		level: { number: number; title: string }
	} | null
}) {
	return {
		id: template.id,
		title: template.title,
		content: template.content as StepContent,
		stepId: template.stepId,
		authorId: template.authorId,
		isSystem: template.isSystem,
		createdAt: template.createdAt.toISOString(),
		updatedAt: template.updatedAt.toISOString(),
		author: template.author,
		step: template.step,
	}
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
	const { id } = await context.params

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const existing = await prisma.extraAssignment.findUnique({ where: { id } })
	if (!existing) return notFound('Задание')

	const body = await request.json()
	const parsed = updateExtraAssignmentSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	try {
		const template = await prisma.extraAssignment.update({
			where: { id },
			data: {
				...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
				...(parsed.data.content !== undefined
					? { content: parsed.data.content }
					: {}),
				...(parsed.data.stepId !== undefined
					? { stepId: parsed.data.stepId }
					: {}),
			},
			include: templateInclude,
		})

		return success(serializeTemplate(template))
	} catch (err) {
		return serverError(err)
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	const { id } = await context.params

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const existing = await prisma.extraAssignment.findUnique({ where: { id } })
	if (!existing) return notFound('Задание')

	if (existing.authorId !== authResult.session.user.id) {
		return error('Можно удалять только свои задания', 403)
	}

	try {
		await prisma.extraAssignment.delete({ where: { id } })
		return success({ deleted: true })
	} catch (err) {
		return serverError(err)
	}
}
