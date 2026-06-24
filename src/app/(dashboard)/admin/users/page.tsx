import { getLevelsForCreateUser, getUsers } from '@/features/user-admin/actions/user-actions'
import { mapUsersToDetails } from '@/features/user-admin/lib/map-users-to-details'
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

	const levelOptions = levels.map((level) => ({
		id: level.id,
		number: level.number,
		title: level.title,
		steps: level.steps.map((step) => ({
			id: step.id,
			order: step.order,
			title: step.title,
		})),
	}))

	const rows = mapUsersToDetails(users, levelOptions)

	return (
		<UsersTable
			users={rows}
			groups={groups}
			levels={levelOptions}
			canResetCode={session.user.role === 'SUPER_ADMIN'}
		/>
	)
}
