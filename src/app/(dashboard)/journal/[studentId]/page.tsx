import { notFound } from 'next/navigation'

import { getStudentLesson } from '@/features/journal/actions/journal-actions'

export const dynamic = 'force-dynamic'
import { LessonPage } from '@/features/journal/ui/LessonPage'

type Props = { params: Promise<{ studentId: string }> }

export default async function StudentLessonPage({ params }: Props) {
	const { studentId } = await params
	const lesson = await getStudentLesson(studentId)

	if (!lesson) notFound()

	return (
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
		/>
	)
}
