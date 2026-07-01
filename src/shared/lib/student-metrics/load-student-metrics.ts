import { endOfMonth, startOfMonth } from 'date-fns'

import { countableSessionWhere } from '@/shared/lib/analytics-queries/filters'
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

type LoadedStudent = NonNullable<
	Awaited<ReturnType<typeof loadStudentRecord>>
>

async function loadStudentRecord(studentId: string) {
	return prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			group: {
				include: {
					teacher: { include: { user: true } },
				},
			},
			sessions: {
				select: {
					date: true,
					attendance: true,
					isAdjustment: true,
				},
			},
			completions: {
				select: {
					createdAt: true,
					isPriorCredit: true,
					grade: true,
					stepId: true,
				},
			},
		},
	})
}

function getLevelStepIds(student: LoadedStudent): Set<string> {
	return new Set(student.level.steps.map((step) => step.id))
}

function getCompletedStepsOnLevel(student: LoadedStudent) {
	const levelStepIds = getLevelStepIds(student)
	const hoursByStepId = new Map(
		student.level.steps.map((step) => [step.id, step.hours]),
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

function getCompletedStepHoursOnLevel(student: LoadedStudent): number[] {
	return getCompletedStepsOnLevel(student).map((step) => step.hours)
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

export type StudentMetricsBundle = {
	periodMetrics: StudentPeriodMetrics
	levelProgress: LevelProgress
	riskFlags: RiskFlag[]
	timeNorm: TimeNormResult
	absencesInMonth: number
	teacherName: string
	levelTitle: string
}

export async function loadStudentMetricsContext(
	studentId: string,
	dateRange: { gte: Date; lte: Date },
	monthLabel: string,
): Promise<StudentMetricsBundle | null> {
	const student = await loadStudentRecord(studentId)
	if (!student) return null

	const [levelStepOffset, durationByDateForPeriod] = await Promise.all([
		getStepOffsetForLevel(student.level.number),
		buildTeachingSessionDurationByDate(student.groupId, dateRange),
	])

	const completedStepsOnLevel = getCompletedStepsOnLevel(student)
	const periodMetrics = computePeriodMetrics({
		sessions: student.sessions,
		completions: student.completions,
		teachingSessionsByDate: teachingSessionsFromDurationMap(
			durationByDateForPeriod,
		),
		completedStepHoursOnLevel: getCompletedStepHoursOnLevel(student),
		dateRange,
		monthLabel,
	})

	const countableSessions = getCountableSessions(student)
	const cumulativeRange = sessionDateRange(countableSessions) ?? dateRange
	const durationByDateCumulative = await buildTeachingSessionDurationByDate(
		student.groupId,
		cumulativeRange,
	)

	const cumulativeActualMinutes = computePeriodMetrics({
		sessions: student.sessions,
		completions: student.completions,
		teachingSessionsByDate: teachingSessionsFromDurationMap(
			durationByDateCumulative,
		),
		completedStepHoursOnLevel: getCompletedStepHoursOnLevel(student),
		dateRange: cumulativeRange,
		monthLabel,
	}).totalMinutes

	const timeNorm = evaluateTimeNormForLevel({
		levelId: student.levelId,
		actualMinutes: cumulativeActualMinutes,
		completedStepsOnLevel,
	})

	const levelProgress = computeLevelProgress({
		currentStepIdx: student.currentStepIdx,
		levelNumber: student.level.number,
		levelStepOffset,
		totalStepsOnLevel: student.level.steps.length,
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
		teacherName: student.group.teacher.user.name,
		levelTitle: student.level.title,
	}
}

export async function loadStudentMetricsForMonth(
	studentId: string,
	month: Date,
	monthLabel: string,
) {
	const dateRange = {
		gte: startOfMonth(month),
		lte: endOfMonth(month),
	}
	return loadStudentMetricsContext(studentId, dateRange, monthLabel)
}

export { teachingSessionDurationFromMap }
