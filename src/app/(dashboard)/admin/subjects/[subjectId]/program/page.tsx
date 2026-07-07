import { notFound } from 'next/navigation'

import { getLevels } from '@/features/program-admin/actions/program-actions'
import { ProgramSubjectView } from '@/features/program-admin/ui/ProgramSubjectView'
import { getSubject } from '@/features/subject-admin/actions/subject-actions'
import { requireRoles } from '@/shared/lib/session'

type Props = { params: Promise<{ subjectId: string }> }

export default async function SubjectProgramPage({ params }: Props) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const { subjectId } = await params

	const [subject, levels] = await Promise.all([
		getSubject(subjectId),
		getLevels(subjectId),
	])

	if (!subject) notFound()

	return (
		<ProgramSubjectView
			subjectId={subjectId}
			subjectName={subject.name}
			levels={levels}
		/>
	)
}
