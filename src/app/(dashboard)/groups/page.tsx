import { getGroups, getTeachers } from '@/features/groups/actions/group-actions'
import { GroupsList } from '@/features/groups/ui/GroupsList'
import { getSubjects } from '@/features/subject-admin/actions/subject-actions'
import { requireRoles } from '@/shared/lib/session'

export default async function GroupsPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const [groups, teachers, subjects] = await Promise.all([
		getGroups(),
		getTeachers(),
		getSubjects(),
	])

	const rows = groups.map((g) => ({
		id: g.id,
		name: g.name,
		teacherId: g.teacherId,
		teacherName: g.teacher.user.name,
		subjectId: g.subjectId,
		subjectName: g.subject.name,
		studentCount: g._count.enrollments,
	}))

	return (
		<GroupsList
			groups={rows}
			teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
			subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
		/>
	)
}
