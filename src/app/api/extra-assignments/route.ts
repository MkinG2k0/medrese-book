import {
	created,
	error,
	forbidden,
	notFound,
	serverError,
	success,
} from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import {
	createExtraAssignmentSchema,
	listExtraAssignmentsQuerySchema,
} from '@/shared/lib/validations/extra-assignment'
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

export async function GET(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const { searchParams } = new URL(request.url)
	const parsed = listExtraAssignmentsQuerySchema.safeParse({
		authorId: searchParams.get('authorId') ?? undefined,
		stepId: searchParams.get('stepId') ?? undefined,
		levelId: searchParams.get('levelId') ?? undefined,
		title: searchParams.get('title') ?? undefined,
		subjectId: searchParams.get('subjectId') ?? undefined,
	})
	if (!parsed.success) return error(parsed.error.message)

	const { authorId, stepId, levelId, title, subjectId } = parsed.data

	const templates = await prisma.extraAssignment.findMany({
		where: {
			...(authorId ? { authorId } : {}),
			...(stepId ? { stepId } : {}),
			...(levelId ? { step: { levelId } } : {}),
			...(subjectId
				? { step: { level: { subjectId } } }
				: {}),
			...(title
				? { title: { contains: title, mode: 'insensitive' as const } }
				: {}),
		},
		include: templateInclude,
		orderBy: [{ createdAt: 'desc' }],
	})

	return success(templates.map(serializeTemplate))
}

export async function POST(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const body = await request.json()
	const parsed = createExtraAssignmentSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	try {
		const template = await prisma.extraAssignment.create({
			data: {
				title: parsed.data.title,
				content: parsed.data.content,
				stepId: parsed.data.stepId ?? null,
				authorId: authResult.session.user.id,
			},
			include: templateInclude,
		})

		return created(serializeTemplate(template))
	} catch (err) {
		return serverError(err)
	}
}
