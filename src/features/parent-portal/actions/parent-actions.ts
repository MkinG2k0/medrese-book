'use server'

import { startOfMonth } from 'date-fns'

import { formatAnalyticsMonth } from '@/shared/lib/analytics'
import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import { loadStudentMetricsForMonth } from '@/shared/lib/student-metrics/load-student-metrics'
import type { StudentPeriodMetrics } from '@/shared/lib/student-metrics/types'
import { getTotalProgramSteps } from '@/shared/lib/student-progress'
import type { StudentStatus } from '@/shared/lib/student-status'

export type ParentChildEnrollmentProgress = {
	groupId: string
	subjectName: string
	groupName: string
	levelTitle: string
	currentStepIdx: number
	totalSteps: number
	periodMetrics: StudentPeriodMetrics
}

export type ParentChildSummary = {
	studentId: string
	name: string
	status: StudentStatus
	enrollments: ParentChildEnrollmentProgress[]
}

export type ParentChildrenDashboard = {
	parentName: string
	children: ParentChildSummary[]
}

export async function getParentChildrenDashboard(): Promise<ParentChildrenDashboard | null> {
	const session = await requireRole('PARENT')

	const parent = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			name: true,
			children: {
				select: {
					id: true,
					status: true,
					fullName: true,
					user: { select: { name: true } },
					enrollments: {
						select: {
							groupId: true,
							currentStepIdx: true,
							group: {
								select: {
									name: true,
									subjectId: true,
									subject: { select: { name: true } },
								},
							},
							level: { select: { number: true, title: true } },
						},
						orderBy: { enrolledAt: 'asc' },
					},
				},
				orderBy: { user: { name: 'asc' } },
			},
		},
	})

	if (!parent) return null

	const month = startOfMonth(new Date())
	const monthLabel = formatAnalyticsMonth(month)

	const children = await Promise.all(
		parent.children.map(async (child) => {
			const enrollments = await Promise.all(
				child.enrollments.map(async (enrollment) => {
					const [totalSteps, metricsResult] = await Promise.all([
						getTotalProgramSteps(enrollment.group.subjectId),
						loadStudentMetricsForMonth(child.id, month, monthLabel, {
							subjectId: enrollment.group.subjectId,
							groupId: enrollment.groupId,
						}),
					])

					return {
						groupId: enrollment.groupId,
						subjectName: enrollment.group.subject.name,
						groupName: enrollment.group.name,
						levelTitle: `${enrollment.level.number}й уровень — ${enrollment.level.title}`,
						currentStepIdx: enrollment.currentStepIdx,
						totalSteps,
						periodMetrics: metricsResult?.periodMetrics ?? {
							lessonsCount: 0,
							stepsCount: 0,
							totalMinutes: 0,
							monthLabel,
						},
					}
				}),
			)

			return {
				studentId: child.id,
				name: child.fullName?.trim() || child.user.name,
				status: child.status,
				enrollments,
			}
		}),
	)

	return {
		parentName: parent.name,
		children,
	}
}
