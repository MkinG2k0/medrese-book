import { endOfMonth, startOfMonth } from 'date-fns'

import { countableSessionWhere } from '@/shared/lib/analytics-queries/filters'
import { primaryEnrollmentOrderBy } from '@/shared/lib/enrollment'
import { prisma } from '@/shared/lib/prisma'
import { isStepPassed } from '@/shared/lib/step-completion'
import { getStepOffsetForLevel } from '@/shared/lib/student-progress'
import {
	buildTeachingSessionDurationByDate,
	teachingSessionDurationFromMap,
} from '@/shared/lib/teaching-session-duration-map'

import {
	countStudentAbsencesInMonth,
	evaluateAttendanceRisk,
} from './attendance-risk'
import {
	computeLevelProgress,
	computePeriodMetrics,
	type LevelProgress,
} from './period-metrics'
import { buildStudentRiskFlags } from './risk-flags'
import { evaluateTimeNormForLevel } from './time-norm'
import type { RiskFlag, StudentPeriodMetrics, TimeNormResult } from './types'

export type StudentMetricsScope = {
	subjectId: string
	groupId?: string | null
}

type LoadedStudent = NonNullable<
	Awaited<ReturnType<typeof loadStudentRecord>>
>

type ScopedEnrollment = LoadedStudent['enrollments'][number]

async function loadStudentRecord(studentId: string, scope: StudentMetricsScope) {
	const enrollments = await prisma.groupEnrollment.findMany({
		where: {
			studentId,
			group: {
				subjectId: scope.subjectId,
				...(scope.groupId ? { id: scope.groupId } : {}),
			},
		},
		orderBy: primaryEnrollmentOrderBy,
		include: {
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			group: {
				include: {
					teacher: { include: { user: true } },
				},
			},
		},
	})

	if (enrollments.length === 0) return null

	const groupIds = enrollments.map((enrollment) => enrollment.groupId)

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			sessions: {
				where: { groupId: { in: groupIds } },
				select: {
					date: true,
					attendance: true,
					isAdjustment: true,
					groupId: true,
				},
			},
			completions: {
				where: {
					session: { groupId: { in: groupIds } },
				},
				select: {
					createdAt: true,
					isPriorCredit: true,
					grade: true,
					stepId: true,
				},
			},
		},
	})

	if (!student) return null

	return { ...student, enrollments }
}

function getLevelStepIds(enrollment: ScopedEnrollment): Set<string> {
	return new Set(enrollment.level.steps.map((step) => step.id))
}

function getCompletedStepsOnLevel(
	student: LoadedStudent,
	enrollment: ScopedEnrollment,
) {
	const levelStepIds = getLevelStepIds(enrollment)
	const hoursByStepId = new Map(
		enrollment.level.steps.map((step) => [step.id, step.hours]),
	)

	return student.completions
		.filter(
			(completion) =>
				levelStepIds.has(completion.stepId) &&
				isStepPassed(completion.grade),
		)
		.map((completion) => ({
			hours: hoursByStepId.get(completion.stepId) ?? 0,
			isPriorCredit: completion.isPriorCredit,
		}))
}

function getCompletedStepHoursOnLevel(
	student: LoadedStudent,
	enrollment: ScopedEnrollment,
): number[] {
	return getCompletedStepsOnLevel(student, enrollment).map((step) => step.hours)
}

function getCountableSessions(student: LoadedStudent) {
	return student.sessions.filter(
		(session) => session.isAdjustment === countableSessionWhere.isAdjustment,
	)
}

function teachingSessionsFromDurationMap(
	durationByDate: Map<string, number | null>,
) {
	return Array.from(durationByDate.entries()).map(([date, durationMinutes]) => ({
		date: new Date(`${date}T12:00:00.000Z`),
		durationMinutes,
	}))
}

function sessionDateRange(sessions: { date: Date }[]) {
	if (sessions.length === 0) return null

	let min = sessions[0]!.date.getTime()
	let max = sessions[0]!.date.getTime()

	for (const session of sessions) {
		const time = session.date.getTime()
		if (time < min) min = time
		if (time > max) max = time
	}

	return { gte: new Date(min), lte: new Date(max) }
}

function pickWorstCaseBundle(
	bundles: StudentMetricsBundle[],
): StudentMetricsBundle {
	return [...bundles].sort((a, b) => {
		const flagDiff = b.riskFlags.length - a.riskFlags.length
		if (flagDiff !== 0) return flagDiff
		return b.absencesInMonth - a.absencesInMonth
	})[0]!
}

export type StudentMetricsBundle = {
	periodMetrics: StudentPeriodMetrics
	levelProgress: LevelProgress
	riskFlags: RiskFlag[]
	timeNorm: TimeNormResult
	absencesInMonth: number
	teacherName: string
	levelTitle: string
}

async function computeMetricsForEnrollment(
	student: LoadedStudent,
	enrollment: ScopedEnrollment,
	dateRange: { gte: Date; lte: Date },
	monthLabel: string,
): Promise<StudentMetricsBundle> {
	const [levelStepOffset, durationByDateForPeriod] = await Promise.all([
		getStepOffsetForLevel(enrollment.level.number),
		buildTeachingSessionDurationByDate(enrollment.groupId, dateRange),
	])

	const completedStepsOnLevel = getCompletedStepsOnLevel(student, enrollment)
	const periodMetrics = computePeriodMetrics({
		sessions: student.sessions,
		completions: student.completions,
		teachingSessionsByDate: teachingSessionsFromDurationMap(
			durationByDateForPeriod,
		),
		completedStepHoursOnLevel: getCompletedStepHoursOnLevel(
			student,
			enrollment,
		),
		dateRange,
		monthLabel,
	})

	const countableSessions = getCountableSessions(student)
	const cumulativeRange = sessionDateRange(countableSessions) ?? dateRange
	const durationByDateCumulative = await buildTeachingSessionDurationByDate(
		enrollment.groupId,
		cumulativeRange,
	)

	const cumulativeActualMinutes = computePeriodMetrics({
		sessions: student.sessions,
		completions: student.completions,
		teachingSessionsByDate: teachingSessionsFromDurationMap(
			durationByDateCumulative,
		),
		completedStepHoursOnLevel: getCompletedStepHoursOnLevel(
			student,
			enrollment,
		),
		dateRange: cumulativeRange,
		monthLabel,
	}).totalMinutes

	const timeNorm = evaluateTimeNormForLevel({
		levelId: enrollment.levelId,
		actualMinutes: cumulativeActualMinutes,
		completedStepsOnLevel,
	})

	const levelProgress = computeLevelProgress({
		currentStepIdx: enrollment.currentStepIdx,
		levelNumber: enrollment.level.number,
		levelStepOffset,
		totalStepsOnLevel: enrollment.level.steps.length,
		completedStepsOnLevel: completedStepsOnLevel.length,
	})

	const monthRange = { gte: dateRange.gte, lte: dateRange.lte }
	const absencesInMonth = countStudentAbsencesInMonth(
		student.sessions,
		monthRange,
	)

	const riskFlags = buildStudentRiskFlags({
		studentId: student.id,
		timeNorm,
		attendanceRisk: evaluateAttendanceRisk({
			sessions: student.sessions,
			monthRange,
		}),
	})

	return {
		periodMetrics,
		levelProgress,
		riskFlags,
		timeNorm,
		absencesInMonth,
		teacherName: enrollment.group.teacher.user.name,
		levelTitle: enrollment.level.title,
	}
}

export async function loadStudentMetricsContext(
	studentId: string,
	dateRange: { gte: Date; lte: Date },
	monthLabel: string,
	scope: StudentMetricsScope,
): Promise<StudentMetricsBundle | null> {
	const student = await loadStudentRecord(studentId, scope)
	if (!student) return null

	const enrollments = student.enrollments
	if (enrollments.length === 0) return null

	if (scope.groupId || enrollments.length === 1) {
		return computeMetricsForEnrollment(
			student,
			enrollments[0]!,
			dateRange,
			monthLabel,
		)
	}

	const bundles = await Promise.all(
		enrollments.map((enrollment) =>
			computeMetricsForEnrollment(student, enrollment, dateRange, monthLabel),
		),
	)

	return pickWorstCaseBundle(bundles)
}

export async function loadStudentMetricsForMonth(
	studentId: string,
	month: Date,
	monthLabel: string,
	scope: StudentMetricsScope,
) {
	const dateRange = {
		gte: startOfMonth(month),
		lte: endOfMonth(month),
	}
	return loadStudentMetricsContext(studentId, dateRange, monthLabel, scope)
}

export { teachingSessionDurationFromMap }
