import { notFound } from 'next/navigation'

import { getLevelSteps } from '@/features/program-admin/actions/program-actions'
import { LevelStepsView } from '@/features/program-admin/ui/LevelStepsView'
import { getSubject } from '@/features/subject-admin/actions/subject-actions'
import {
	getStepOffsetForLevel,
	toGlobalStepNumber,
} from '@/shared/lib/student-progress'
import { requireRoles } from '@/shared/lib/session'

type Props = {
	params: Promise<{ subjectId: string; levelId: string }>
}

export default async function SubjectLevelStepsPage({ params }: Props) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const { subjectId, levelId } = await params

	const [subject, level] = await Promise.all([
		getSubject(subjectId),
		getLevelSteps(subjectId, levelId),
	])

	if (!subject || !level) notFound()

	const stepOffset = await getStepOffsetForLevel(level.number, subjectId)

	return (
		<LevelStepsView
			subjectId={subjectId}
			subjectName={subject.name}
			levelId={levelId}
			levelNumber={level.number}
			levelTitle={level.title}
			steps={level.steps.map((step) => ({
				...step,
				globalNumber: toGlobalStepNumber(stepOffset, step.order),
			}))}
		/>
	)
}
