import { prisma } from '@/shared/lib/prisma'
import { loadStudentMetricsForMonth } from '@/shared/lib/student-metrics/load-student-metrics'
import type { AtRiskStudentRow } from '@/shared/lib/student-metrics/types'

function formatMonthLabel(month: Date): string {
	return new Intl.DateTimeFormat('ru-RU', {
		month: 'long',
		year: 'numeric',
	}).format(month)
}

function buildGroupScopeFilter(
	subjectId: string,
	teacherId?: string | null,
	groupId?: string | null,
) {
	return {
		subjectId,
		...(groupId ? { id: groupId } : {}),
		...(teacherId && !groupId ? { teacherId } : {}),
	}
}

export async function getAtRiskStudents(
	month: Date,
	teacherId: string | null | undefined,
	groupId: string | null | undefined,
	subjectId: string,
): Promise<AtRiskStudentRow[]> {
	const groupScope = buildGroupScopeFilter(subjectId, teacherId, groupId)

	const students = await prisma.student.findMany({
		where: {
			enrollments: {
				some: {
					group: groupScope,
				},
			},
		},
		include: {
			user: { select: { name: true } },
		},
	})

	const monthLabel = formatMonthLabel(month)
	const scope = { subjectId, groupId: groupId ?? undefined }

	const rows: AtRiskStudentRow[] = []

	for (const student of students) {
		const metrics = await loadStudentMetricsForMonth(
			student.id,
			month,
			monthLabel,
			scope,
		)
		if (!metrics || metrics.riskFlags.length === 0) continue

		rows.push({
			student: { id: student.id, name: student.user.name },
			teacherName: metrics.teacherName,
			levelTitle: metrics.levelTitle,
			riskFlags: metrics.riskFlags,
			absencesInMonth: metrics.absencesInMonth,
			actualMinutes: metrics.timeNorm.actualMinutes,
			budgetMinutes: metrics.timeNorm.budgetMinutes,
		})
	}

	return rows.sort((a, b) =>
		a.student.name.localeCompare(b.student.name, 'ru'),
	)
}
