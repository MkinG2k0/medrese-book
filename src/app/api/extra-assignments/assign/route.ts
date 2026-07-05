import {
	created,
	error,
	notFound,
	serverError,
} from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { assignExtraAssignmentSchema } from '@/shared/lib/validations/extra-assignment'
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

export async function POST(request: Request) {
	const body = await request.json()
	const parsed = assignExtraAssignmentSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	const { templateId, studentId, sessionId, displayStepId } = parsed.data

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
		context: { studentId },
	})
	if ('error' in authResult) return authResult.error

	const [template, session] = await Promise.all([
		prisma.extraAssignment.findUnique({ where: { id: templateId } }),
		prisma.session.findUnique({ where: { id: sessionId } }),
	])

	if (!template) return notFound('Шаблон задания')
	if (!session || session.studentId !== studentId) {
		return notFound('Занятие')
	}

	const step = await prisma.step.findUnique({ where: { id: displayStepId } })
	if (!step) return notFound('Шаг')

	try {
		const instance = await prisma.studentExtraAssignment.create({
			data: {
				templateId,
				studentId,
				sessionId,
				displayStepId,
				assignedById: authResult.session.user.id,
			},
			include: instanceInclude,
		})

		return created(serializeInstance(instance))
	} catch (err) {
		return serverError(err)
	}
}
