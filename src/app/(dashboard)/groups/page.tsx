import { getGroups } from '@/features/groups/actions/group-actions'
import { GroupsList } from '@/features/groups/ui/GroupsList'
import { requireRoles } from '@/shared/lib/session'

export default async function GroupsPage() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])
	const groups = await getGroups()

	const rows = groups.map((g) => ({
		id: g.id,
		name: g.name,
		teacherName: g.teacher.user.name,
		levelTitle: g.level.title,
		studentCount: g._count.students,
	}))

	return <GroupsList groups={rows} />
}
