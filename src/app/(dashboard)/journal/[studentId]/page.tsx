import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getStudentLesson } from '@/features/journal/actions/journal-actions'
import { resolveJournalDate } from '@/features/journal/lib/journal-url'

export const dynamic = 'force-dynamic'
import { LessonPage } from '@/features/journal/ui/LessonPage'
import { PageLoader } from '@/shared/ui/PageLoader'

type Props = {
	params: Promise<{ studentId: string }>
	searchParams: Promise<{ date?: string }>
}

export default async function StudentLessonPage({ params, searchParams }: Props) {
	const { studentId } = await params
	const { date: dateParam } = await searchParams
	const calendarDate = resolveJournalDate(dateParam)
	const lesson = await getStudentLesson(studentId, calendarDate)

	if (!lesson) notFound()

	return (
		<Suspense fallback={<PageLoader size="lg" />}>
			<LessonPage
				groupId={lesson.groupId}
				studentId={lesson.student.id}
				studentName={lesson.student.name}
				currentStepIdx={lesson.student.currentStepIdx}
				levelNumber={lesson.level.number}
				totalSteps={lesson.totalSteps}
				totalProgramSteps={lesson.totalProgramSteps}
				totalHours={lesson.totalHours}
				steps={lesson.steps}
				allSteps={lesson.allSteps}
				hasNextLevel={lesson.hasNextLevel}
				prefetchedSessionSteps={lesson.prefetchedSessionSteps}
				nextLevelSteps={lesson.nextLevelSteps}
				stepCompletions={lesson.stepCompletions}
				nextStudent={lesson.nextStudent}
				initialSession={lesson.initialSession}
				sessionDate={lesson.sessionDate}
				riskFlags={lesson.riskFlags}
				periodMetrics={lesson.periodMetrics}
			/>
		</Suspense>
	)
}
