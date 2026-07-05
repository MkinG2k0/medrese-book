import { error, success } from '@/shared/api'
import {
	getCalendarDayQueryRange,
	isSameCalendarDay,
	isValidCalendarDate,
} from '@/shared/lib/calendar-date'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
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
	session: { select: { date: true } },
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

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const studentId = searchParams.get('studentId')
	if (!studentId) return error('studentId обязателен')

	const dateStr = searchParams.get('date')
	if (dateStr && !isValidCalendarDate(dateStr)) {
		return error('Некорректная дата')
	}

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
		context: { studentId },
	})
	if ('error' in authResult) return authResult.error

	const dayRange = dateStr ? getCalendarDayQueryRange(dateStr) : null

	const rawInstances = await prisma.studentExtraAssignment.findMany({
		where: {
			studentId,
			...(dayRange
				? { session: { date: { gte: dayRange.start, lte: dayRange.end } } }
				: {}),
		},
		include: instanceInclude,
		orderBy: { createdAt: 'asc' },
	})

	const instances = dateStr
		? rawInstances.filter((instance) =>
				isSameCalendarDay(instance.session.date, dateStr),
			)
		: rawInstances

	return success(instances.map(serializeInstance))
}
