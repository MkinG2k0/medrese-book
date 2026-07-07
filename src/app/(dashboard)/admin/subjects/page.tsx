import { getSubjects } from '@/features/subject-admin/actions/subject-actions'
import { SubjectsList } from '@/features/subject-admin'
import { requireRoles } from '@/shared/lib/session'

export default async function SubjectsPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const subjects = await getSubjects()

	const rows = subjects.map((subject) => ({
		id: subject.id,
		name: subject.name,
		description: subject.description,
		levelCount: subject._count.levels,
		stepCount: subject.levels.reduce(
			(sum, level) => sum + level._count.steps,
			0,
		),
	}))

	return <SubjectsList subjects={rows} />
}
