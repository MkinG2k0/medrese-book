'use server'

import { revalidatePath } from 'next/cache'

import {
	getLessonCalendarDay,
	getLessonDayRange,
	isLessonCalendarDay,
	mapStepMeta,
	type JournalStep,
} from '@/features/journal/lib/journal-step'
import { serializeDaySession } from '@/features/journal/lib/get-student-session'
import type { ClientDaySession } from '@/features/journal/lib/get-student-session'
import { prisma } from '@/shared/lib/prisma'
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

async function requireTeacherStudent(studentId: string) {
	const session = await requireRole('TEACHER')

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			id: true,
			group: { select: { teacherId: true } },
		},
	})

	if (!student || student.group.teacherId !== session.user.teacherId) {
		return null
	}

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
			description: true,
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

export async function getTeacherGroup() {
	const session = await requireRole('TEACHER')

	return prisma.group.findFirst({
		where: { teacherId: session.user.teacherId! },
	})
}

export async function resumeStudentFromPause(studentId: string) {
	const session = await requireRole('TEACHER')

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: { group: { select: { teacherId: true } } },
	})

	if (!student || student.group.teacherId !== session.user.teacherId) {
		throw new Error('Ученик не найден')
	}

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
): Promise<StepContent | null> {
	await requireRole('TEACHER')

	const step = await prisma.step.findUnique({
		where: { id: stepId },
		select: { content: true },
	})

	if (!step) return null
	return step.content as StepContent
}

export async function getNextLevelJournalSteps(
	studentId: string,
): Promise<JournalStep[]> {
	const access = await requireTeacherStudent(studentId)
	if (!access) return []

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			level: { select: { number: true, title: true } },
		},
	})

	if (!student) return []

	const nextLevel = await prisma.level.findFirst({
		where: { number: student.level.number + 1 },
		include: {
			steps: {
				select: {
					id: true,
					order: true,
					title: true,
					description: true,
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

export async function getStudentLesson(studentId: string) {
	const session = await requireRole('TEACHER')
	const today = getLessonCalendarDay()
	const dayRange = getLessonDayRange(today)

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			group: {
				include: {
					students: {
						include: { user: { select: { name: true } } },
					},
				},
			},
			level: {
				include: {
					steps: {
						select: {
							id: true,
							order: true,
							title: true,
							description: true,
							hours: true,
						},
						orderBy: { order: 'asc' },
					},
				},
			},
			completions: {
				where: {
					step: { level: { students: { some: { id: studentId } } } },
				},
				select: { stepId: true, grade: true, note: true },
				orderBy: { createdAt: 'asc' },
			},
			sessions: {
				where: {
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
	})

	if (!student) return null
	if (student.group.teacherId !== session.user.teacherId) return null
	if (student.status === 'ARCHIVE') return null

	const levelStepIds = new Set(student.level.steps.map((step) => step.id))
	const daySession =
		student.sessions.find((item) => isLessonCalendarDay(item.date, today)) ??
		null

	const [hasNextLevel, totalProgramSteps, prefetchedSessionSteps] =
		await Promise.all([
			prisma.level.findFirst({
				where: { number: student.level.number + 1 },
				select: { id: true },
			}),
			getTotalProgramSteps(),
			fetchSessionOutsideLevelSteps(
				levelStepIds,
				daySession?.completions ?? [],
			),
		])

	const allSteps = student.level.steps.map((step) =>
		mapStepMeta(step, student.level.number, student.level.title),
	)
	const completionsByStepId = getCompletionsByStepId(student.completions)
	const incompleteSteps = filterIncompleteSteps(allSteps, completionsByStepId)
	const totalHours = sumPassedStepHours(allSteps, completionsByStepId)

	const sortedActiveStudents = [...student.group.students]
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
	for (const completion of student.completions) {
		stepCompletionsByStep.set(completion.stepId, completion)
	}

	const initialSession: ClientDaySession | null = daySession
		? serializeDaySession(daySession)
		: null

	return {
		student: {
			id: student.id,
			name: student.user.name,
			currentStepIdx: student.currentStepIdx,
		},
		level: {
			number: student.level.number,
			title: student.level.title,
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
		sessionDate: today,
	}
}

export async function getStudentStepHistory(studentId: string) {
	const session = await requireRole('TEACHER')

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			level: true,
			group: true,
		},
	})

	if (!student) return null
	if (student.group.teacherId !== session.user.teacherId) return null

	return {
		student: {
			id: student.id,
			name: student.user.name,
			currentStepIdx: student.currentStepIdx,
		},
		level: {
			number: student.level.number,
			title: student.level.title,
		},
	}
}
