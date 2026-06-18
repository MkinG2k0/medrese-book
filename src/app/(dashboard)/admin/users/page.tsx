import { getLevelsForCreateUser, getUsers } from '@/features/user-admin/actions/user-actions'
import { UsersTable } from '@/features/user-admin/ui/UsersTable'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export default async function AdminUsersPage() {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const [users, groups, levels] = await Promise.all([
		getUsers(),
		prisma.group.findMany({ select: { id: true, name: true } }),
		getLevelsForCreateUser(),
	])

	const rows = users.map((user) => ({
		id: user.id,
		name: user.name,
		code: user.code,
		role: user.role,
		phone: user.phone ?? undefined,
		createdAt: user.createdAt.toISOString(),
		groupName: user.student?.group?.name,
		teacherGroupNames: user.teacher?.groups.map((group) => group.name),
		student: user.student
			? {
					fullName: user.student.fullName ?? undefined,
					phone: user.student.phone ?? undefined,
					guardianPhone: user.student.guardianPhone ?? undefined,
					currentStepIdx: user.student.currentStepIdx,
					levelTitle: user.student.level.title,
				}
			: undefined,
	}))

	return (
		<UsersTable
			users={rows}
			groups={groups}
			levels={levels.map((level) => ({
				id: level.id,
				number: level.number,
				title: level.title,
				steps: level.steps.map((step) => ({
					id: step.id,
					order: step.order,
					title: step.title,
				})),
			}))}
			canResetCode={session.user.role === 'SUPER_ADMIN'}
		/>
	)
}
