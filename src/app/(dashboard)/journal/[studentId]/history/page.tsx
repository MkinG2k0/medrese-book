import { notFound } from 'next/navigation'

import { getStudentStepHistory } from '@/features/journal/actions/journal-actions'
import { buildJournalHref } from '@/features/journal/lib/journal-url'
import { StepHistoryPage } from '@/features/journal/ui/StepHistoryPage'
import { getLocalDateString } from '@/shared/lib/calendar-date'
import { requireRole } from '@/shared/lib/session'

type Props = {
	params: Promise<{ studentId: string }>
	searchParams: Promise<{ groupId?: string }>
}

export default async function StudentStepHistoryPage({
	params,
	searchParams,
}: Props) {
	await requireRole('TEACHER')
	const { studentId } = await params
	const { groupId } = await searchParams
	if (!groupId) notFound()

	const history = await getStudentStepHistory(studentId, groupId)

	if (!history) notFound()

	return (
		<StepHistoryPage
			studentId={history.student.id}
			studentName={history.student.name}
			currentStepIdx={history.currentStepIdx}
			levelNumber={history.level.number}
			levelTitle={history.level.title}
			backHref={buildJournalHref(
				`/journal/${studentId}`,
				getLocalDateString(),
				groupId,
			)}
			backLabel="Назад к уроку"
		/>
	)
}
