'use server'

import { revalidatePath } from 'next/cache'
import { startOfMonth } from 'date-fns'

import {
	getLessonCalendarDay,
	getLessonDayRange,
	isLessonCalendarDay,
	mapStepMeta,
	type JournalStep,
} from '@/features/journal/lib/journal-step'
import { serializeDaySession } from '@/features/journal/lib/get-student-session'
import type { ClientDaySession } from '@/features/journal/lib/get-student-session'
import { findEnrollmentInGroup } from '@/shared/lib/enrollment'
import { prisma } from '@/shared/lib/prisma'
import { formatAnalyticsMonth } from '@/shared/lib/analytics'
import { loadStudentMetricsForMonth } from '@/shared/lib/student-metrics/load-student-metrics'
import { getTotalProgramSteps } from '@/shared/lib/student-progress'
import { isActiveForLesson } from '@/shared/lib/student-status'
import { requireRole } from '@/shared/lib/session'
import {
	filterIncompleteSteps,
	getCompletionsByStepId,
	sumPassedStepHours,
} from '@/shared/lib/step-completion'
import type { StepContent } from '@/shared/lib/validations/step'

export type { JournalStep } from '@/features/journal/lib/journal-step'

export type TeacherJournalGroup = {
	id: string
	name: string
	subjectId: string
	subjectName: string
}

async function assertTeacherOwnsGroup(teacherId: string, groupId: string) {
	return prisma.group.findUnique({
		where: { id: groupId, teacherId },
	})
}

async function requireTeacherStudent(studentId: string, groupId: string) {
	const session = await requireRole('TEACHER')
	const group = await assertTeacherOwnsGroup(session.user.teacherId!, groupId)
	if (!group) return null

	const enrollment = await findEnrollmentInGroup(studentId, groupId)
	if (!enrollment) return null

	return session
}

async function fetchSessionOutsideLevelSteps(
	levelStepIds: Set<string>,
	completions: { stepId: string }[],
): Promise<JournalStep[]> {
	const outsideIds = [
		...new Set(
			completions
				.map((completion) => completion.stepId)
				.filter((stepId) => !levelStepIds.has(stepId)),
		),
	]

	if (outsideIds.length === 0) return []

	const steps = await prisma.step.findMany({
		where: { id: { in: outsideIds } },
		select: {
			id: true,
			order: true,
			title: true,
			hours: true,
			level: { select: { number: true, title: true } },
		},
	})

	return steps.map((step) =>
		mapStepMeta(
			step,
			step.level.number,
			step.level.title,
		),
	)
}

export async function getTeacherGroups(): Promise<TeacherJournalGroup[]> {
	const session = await requireRole('TEACHER')

	const groups = await prisma.group.findMany({
		where: { teacherId: session.user.teacherId! },
		include: {
			subject: { select: { id: true, name: true } },
		},
		orderBy: { name: 'asc' },
	})

	return groups.map((group) => ({
		id: group.id,
		name: group.name,
		subjectId: group.subject.id,
		subjectName: group.subject.name,
	}))
}

export async function resumeStudentFromPause(studentId: string, groupId: string) {
	const session = await requireRole('TEACHER')
	const group = await assertTeacherOwnsGroup(session.user.teacherId!, groupId)
	if (!group) throw new Error('Ученик не найден')

	const enrollment = await findEnrollmentInGroup(studentId, groupId)
	if (!enrollment) throw new Error('Ученик не найден')

	const student = enrollment.student
	if (student.status !== 'PAUSE') {
		throw new Error('Ученик не на паузе')
	}

	await prisma.student.update({
		where: { id: studentId },
		data: { status: 'ACTIVE' },
	})

	revalidatePath('/journal')
	revalidatePath(`/journal/${studentId}`)

	return { ok: true as const }
}

export async function getJournalStepContent(
	stepId: string,
): Promise<{ content: StepContent; teacherNote: StepContent } | null> {
	await requireRole('TEACHER')

	const step = await prisma.step.findUnique({
		where: { id: stepId },
		select: { content: true, teacherNote: true },
	})

	if (!step) return null
	return {
		content: step.content as StepContent,
		teacherNote: step.teacherNote as StepContent,
	}
}

export async function getNextLevelJournalSteps(
	studentId: string,
	groupId: string,
): Promise<JournalStep[]> {
	const access = await requireTeacherStudent(studentId, groupId)
	if (!access) return []

	const enrollment = await findEnrollmentInGroup(studentId, groupId)
	if (!enrollment) return []

	const nextLevel = await prisma.level.findFirst({
		where: { number: enrollment.level.number + 1 },
		include: {
			steps: {
				select: {
					id: true,
					order: true,
					title: true,
					hours: true,
				},
				orderBy: { order: 'asc' },
			},
		},
	})

	if (!nextLevel) return []

	return nextLevel.steps.map((step) =>
		mapStepMeta(step, nextLevel.number, nextLevel.title),
	)
}

export async function getStudentLesson(
	studentId: string,
	calendarDate: string = getLessonCalendarDay(),
	groupId: string,
) {
	const session = await requireRole('TEACHER')
	const dayRange = getLessonDayRange(calendarDate)

	const ownedGroup = await assertTeacherOwnsGroup(
		session.user.teacherId!,
		groupId,
	)
	if (!ownedGroup) return null

	const targetGroupId = groupId

	const enrollment = await prisma.groupEnrollment.findUnique({
		where: {
			studentId_groupId: { studentId, groupId: targetGroupId },
		},
		include: {
			group: {
				select: {
					subjectId: true,
					name: true,
					subject: { select: { name: true } },
				},
			},
			level: {
				include: {
					steps: {
						select: {
							id: true,
							order: true,
							title: true,
							hours: true,
						},
						orderBy: { order: 'asc' },
					},
				},
			},
			student: {
				include: {
					user: true,
					completions: {
						select: { stepId: true, grade: true, note: true },
						orderBy: { createdAt: 'asc' },
					},
					sessions: {
						where: {
							groupId: targetGroupId,
							date: { gte: dayRange.start, lte: dayRange.end },
						},
						select: {
							id: true,
							studentId: true,
							date: true,
							attendance: true,
							lateMinutes: true,
							note: true,
							completions: {
								select: { stepId: true, grade: true, note: true },
							},
						},
						orderBy: { date: 'desc' },
					},
				},
			},
		},
	})

	if (!enrollment) return null

	const student = enrollment.student
	if (student.status === 'ARCHIVE') return null

	const level = enrollment.level
	const levelStepIds = new Set(level.steps.map((step) => step.id))
	const levelCompletions = student.completions.filter((completion) =>
		levelStepIds.has(completion.stepId),
	)

	const daySession =
		student.sessions.find((item) =>
			isLessonCalendarDay(item.date, calendarDate),
		) ?? null

	const [hasNextLevel, totalProgramSteps, prefetchedSessionSteps, groupEnrollments] =
		await Promise.all([
			prisma.level.findFirst({
				where: { number: level.number + 1 },
				select: { id: true },
			}),
			getTotalProgramSteps(enrollment.group.subjectId),
			fetchSessionOutsideLevelSteps(
				levelStepIds,
				daySession?.completions ?? [],
			),
			prisma.groupEnrollment.findMany({
				where: { groupId: targetGroupId },
				include: {
					student: {
						include: { user: { select: { name: true } } },
					},
				},
			}),
		])

	const allSteps = level.steps.map((step) =>
		mapStepMeta(step, level.number, level.title),
	)
	const completionsByStepId = getCompletionsByStepId(levelCompletions)
	const incompleteSteps = filterIncompleteSteps(allSteps, completionsByStepId)
	const totalHours = sumPassedStepHours(allSteps, completionsByStepId)

	const sortedActiveStudents = groupEnrollments
		.map((item) => item.student)
		.filter((item) => isActiveForLesson(item.status))
		.sort((a, b) => a.user.name.localeCompare(b.user.name))
	const currentIndex = sortedActiveStudents.findIndex(
		(item) => item.id === studentId,
	)
	const nextStudent = sortedActiveStudents[currentIndex + 1] ?? null

	const stepCompletionsByStep = new Map<
		string,
		{ stepId: string; grade: number; note: string | null }
	>()
	for (const completion of levelCompletions) {
		stepCompletionsByStep.set(completion.stepId, completion)
	}

	const initialSession: ClientDaySession | null = daySession
		? serializeDaySession(daySession)
		: null

	const month = startOfMonth(new Date())
	const monthLabel = formatAnalyticsMonth(month)
	const metricsBundle = await loadStudentMetricsForMonth(
		studentId,
		month,
		monthLabel,
		{
			subjectId: enrollment.group.subjectId,
			groupId: targetGroupId,
		},
	)

	return {
		groupId: targetGroupId,
		groupName: enrollment.group.name,
		subjectId: enrollment.group.subjectId,
		subjectName: enrollment.group.subject.name,
		currentStepIdx: enrollment.currentStepIdx,
		student: {
			id: student.id,
			name: student.user.name,
		},
		level: {
			number: level.number,
			title: level.title,
		},
		totalSteps: allSteps.length,
		totalProgramSteps,
		totalHours,
		allSteps,
		hasNextLevel: hasNextLevel != null,
		prefetchedSessionSteps,
		nextLevelSteps: [] as JournalStep[],
		stepCompletions: [...stepCompletionsByStep.values()],
		steps: incompleteSteps,
		nextStudent: nextStudent
			? { id: nextStudent.id, name: nextStudent.user.name }
			: null,
		initialSession,
		sessionDate: calendarDate,
		riskFlags: metricsBundle?.riskFlags ?? [],
		periodMetrics: metricsBundle?.periodMetrics ?? null,
	}
}

export async function getStudentStepHistory(studentId: string, groupId: string) {
	const session = await requireRole('TEACHER')
	const group = await assertTeacherOwnsGroup(session.user.teacherId!, groupId)
	if (!group) return null

	const enrollment = await findEnrollmentInGroup(studentId, groupId)
	if (!enrollment) return null

	const student = enrollment.student

	return {
		currentStepIdx: enrollment.currentStepIdx,
		student: {
			id: student.id,
			name: student.user.name,
		},
		level: {
			number: enrollment.level.number,
			title: enrollment.level.title,
		},
	}
}
