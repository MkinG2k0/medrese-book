import { notFound } from 'next/navigation'

import { getStudentLesson } from '@/features/journal/actions/journal-actions'
import { LessonPage } from '@/features/journal/ui/LessonPage'
import { requireRole } from '@/shared/lib/session'

type Props = { params: Promise<{ studentId: string }> }

export default async function StudentLessonPage({ params }: Props) {
	await requireRole('TEACHER')
	const { studentId } = await params
	const lesson = await getStudentLesson(studentId)

	if (!lesson) notFound()

	return (
		<LessonPage
			studentId={lesson.student.id}
			studentName={lesson.student.name}
			currentStepIdx={lesson.student.currentStepIdx}
			levelNumber={lesson.level.number}
			totalSteps={lesson.totalSteps}
			totalHours={lesson.totalHours}
			steps={lesson.steps}
			nextStudent={lesson.nextStudent}
		/>
	)
}
