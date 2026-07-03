import { getGroups, getTeachers } from '@/features/groups/actions/group-actions'
import { GroupsList } from '@/features/groups/ui/GroupsList'
import { requireRoles } from '@/shared/lib/session'

export default async function GroupsPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const [groups, teachers] = await Promise.all([getGroups(), getTeachers()])

	const rows = groups.map((g) => ({
		id: g.id,
		name: g.name,
		teacherId: g.teacherId,
		teacherName: g.teacher.user.name,
		studentCount: g._count.students,
	}))

	return (
		<GroupsList
			groups={rows}
			teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
		/>
	)
}
