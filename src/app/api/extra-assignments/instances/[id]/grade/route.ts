import {
	error,
	notFound,
	serverError,
	success,
} from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { gradeExtraAssignmentSchema } from '@/shared/lib/validations/extra-assignment'
import type { StepContent } from '@/shared/lib/validations/step'

const instanceInclude = {
	template: {
		include: {
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
		},
	},
	completion: true,
} as const

function serializeInstance(instance: {
	id: string
	templateId: string
	studentId: string
	sessionId: string
	displayStepId: string
	assignedById: string
	createdAt: Date
	template: {
		id: string
		title: string
		content: unknown
		author: { id: string; name: string }
		step: {
			id: string
			order: number
			title: string
			levelId: string
			level: { number: number; title: string }
		} | null
	}
	completion: {
		id: string
		grade: number
		note: string | null
		createdAt: Date
	} | null
}) {
	return {
		id: instance.id,
		templateId: instance.templateId,
		studentId: instance.studentId,
		sessionId: instance.sessionId,
		displayStepId: instance.displayStepId,
		assignedById: instance.assignedById,
		createdAt: instance.createdAt.toISOString(),
		template: {
			id: instance.template.id,
			title: instance.template.title,
			content: instance.template.content as StepContent,
			author: instance.template.author,
			step: instance.template.step,
		},
		completion: instance.completion
			? {
					id: instance.completion.id,
					grade: instance.completion.grade,
					note: instance.completion.note,
					createdAt: instance.completion.createdAt.toISOString(),
				}
			: null,
	}
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
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

	const body = await request.json()
	const parsed = gradeExtraAssignmentSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	try {
		const updated = await prisma.studentExtraAssignment.update({
			where: { id },
			data: {
				completion: {
					upsert: {
						create: {
							grade: parsed.data.grade,
							note: parsed.data.note ?? null,
						},
						update: {
							grade: parsed.data.grade,
							note: parsed.data.note ?? null,
						},
					},
				},
			},
			include: instanceInclude,
		})

		return success(serializeInstance(updated))
	} catch (err) {
		return serverError(err)
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	const { id } = await context.params

	const instance = await prisma.studentExtraAssignment.findUnique({
		where: { id },
		select: { id: true, studentId: true, completion: { select: { id: true } } },
	})
	if (!instance) return notFound('Назначение')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
		context: { studentId: instance.studentId },
	})
	if ('error' in authResult) return authResult.error

	try {
		if (instance.completion) {
			await prisma.extraAssignmentCompletion.delete({
				where: { studentExtraAssignmentId: id },
			})
		}
		return success({ cleared: true })
	} catch (err) {
		return serverError(err)
	}
}
