'use server'

import { startOfMonth } from 'date-fns'

import {
	findEnrollmentInGroup,
	findPrimaryEnrollment,
	primaryEnrollmentOrderBy,
} from '@/shared/lib/enrollment'
import { prisma } from '@/shared/lib/prisma'
import { formatAnalyticsMonth } from '@/shared/lib/analytics'
import { requireRole } from '@/shared/lib/session'
import {
	buildTeachingSessionDurationByDate,
	teachingSessionDurationFromMap,
} from '@/shared/lib/teaching-session-duration-map'
import { loadStudentMetricsForMonth } from '@/shared/lib/student-metrics/load-student-metrics'
import type { StudentPeriodMetrics } from '@/shared/lib/student-metrics/types'
import {
	getLocalStepIdx,
	getStepOffsetForLevel,
	getTotalProgramSteps,
} from '@/shared/lib/student-progress'
import { getCompletionsByStepId } from '@/shared/lib/step-completion'
import type { StepContent } from '@/shared/lib/validations/step'

export type StudentEnrollmentDashboardItem = {
	groupId: string
	subjectName: string
	groupName: string
	levelTitle: string
	currentStepIdx: number
	totalSteps: number
	periodMetrics: StudentPeriodMetrics
}

export type StudentEnrollmentDashboard = {
	studentName: string
	enrollments: StudentEnrollmentDashboardItem[]
}

export async function getStudentEnrollmentDashboard(): Promise<StudentEnrollmentDashboard | null> {
	const session = await requireRole('STUDENT')
	const studentId = session.user.studentId
	if (!studentId) return null

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: { user: true },
	})
	if (!student) return null

	const enrollments = await prisma.groupEnrollment.findMany({
		where: { studentId },
		orderBy: { enrolledAt: 'asc' },
		include: {
			group: { include: { subject: true } },
			level: true,
		},
	})

	if (enrollments.length === 0) return null

	const month = startOfMonth(new Date())
	const monthLabel = formatAnalyticsMonth(month)

	const enrollmentCards = await Promise.all(
		enrollments.map(async (enrollment) => {
			const [totalSteps, metricsResult] = await Promise.all([
				getTotalProgramSteps(enrollment.group.subjectId),
				loadStudentMetricsForMonth(studentId, month, monthLabel, {
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
		studentName: student.user.name,
		enrollments: enrollmentCards,
	}
}

async function resolveStudentEnrollment(studentId: string, groupId?: string) {
	if (groupId) {
		return findEnrollmentInGroup(studentId, groupId)
	}

	return findPrimaryEnrollment(studentId)
}

export async function getStudentEnrollmentGroupIds(): Promise<string[]> {
	const session = await requireRole('STUDENT')
	const studentId = session.user.studentId
	if (!studentId) return []

	const enrollments = await prisma.groupEnrollment.findMany({
		where: { studentId },
		orderBy: primaryEnrollmentOrderBy,
		select: { groupId: true },
	})

	return enrollments.map((enrollment) => enrollment.groupId)
}

export async function getStudentAwards() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			awards: { orderBy: { date: 'desc' } },
		},
	})

	if (!student) return null

	return { awards: student.awards }
}

export async function getStudentLessons(groupId?: string) {
	const session = await requireRole('STUDENT')
	const studentId = session.user.studentId!
	const enrollment = await resolveStudentEnrollment(studentId, groupId)
	if (!enrollment) return null

	const [student, groupWithSubject] = await Promise.all([
		prisma.student.findUnique({
			where: { id: studentId },
			include: {
				completions: {
					select: { stepId: true, grade: true },
					orderBy: { createdAt: 'asc' },
				},
			},
		}),
		prisma.group.findUnique({
			where: { id: enrollment.groupId },
			select: { name: true, subject: { select: { name: true } } },
		}),
	])

	if (!student || !groupWithSubject) return null

	const steps = enrollment.level.steps
	const stepIds = new Set(steps.map((step) => step.id))
	const completionsByStepId = getCompletionsByStepId(
		student.completions.filter((c) => stepIds.has(c.stepId)),
	)
	const stepOffset = await getStepOffsetForLevel(
		enrollment.level.number,
		enrollment.group.subjectId,
	)
	const localStepIdx = getLocalStepIdx(enrollment.currentStepIdx, stepOffset)

	return {
		groupName: groupWithSubject.name,
		subjectName: groupWithSubject.subject.name,
		levelTitle: `${enrollment.level.number}й уровень — ${enrollment.level.title}`,
		lessons: steps.map((step, index) => ({
			id: step.id,
			number: index + 1,
			title: step.title,
			content: step.content as StepContent,
			grade: completionsByStepId.get(step.id)?.grade ?? null,
			isCurrent: index === localStepIdx,
		})),
	}
}

export async function getStudentSessionHistory(groupId?: string) {
	const session = await requireRole('STUDENT')
	const studentId = session.user.studentId!
	const enrollment = await resolveStudentEnrollment(studentId, groupId)
	if (!enrollment) return null

	const [sessions, groupWithSubject] = await Promise.all([
		prisma.session.findMany({
			where: {
				studentId,
				groupId: enrollment.groupId,
			},
			include: { completions: { include: { step: true } } },
			orderBy: { date: 'desc' },
			take: 50,
		}),
		prisma.group.findUnique({
			where: { id: enrollment.groupId },
			select: { name: true, subject: { select: { name: true } } },
		}),
	])

	if (!groupWithSubject) return null

	const sessionDates = sessions.map((item) => item.date)
	const durationByDate =
		sessionDates.length > 0
			? await buildTeachingSessionDurationByDate(enrollment.groupId, {
					gte: new Date(
						Math.min(...sessionDates.map((date) => date.getTime())),
					),
					lte: new Date(
						Math.max(...sessionDates.map((date) => date.getTime())),
					),
				})
			: new Map<string, number | null>()

	return {
		groupName: groupWithSubject.name,
		subjectName: groupWithSubject.subject.name,
		sessions: sessions.map((item) => ({
			...item,
			durationMinutes: teachingSessionDurationFromMap(
				durationByDate,
				item.date,
			),
		})),
	}
}
