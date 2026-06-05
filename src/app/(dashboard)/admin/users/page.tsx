import { getUsers } from '@/features/user-admin/actions/user-actions'
import { UsersTable } from '@/features/user-admin/ui/UsersTable'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export default async function AdminUsersPage() {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const [users, groups] = await Promise.all([
		getUsers(),
		prisma.group.findMany({ select: { id: true, name: true } }),
	])

	const rows = users.map((user) => ({
		id: user.id,
		name: user.name,
		code: user.code,
		role: user.role,
		groupName: user.student?.group?.name,
	}))

	return (
		<UsersTable
			users={rows}
			groups={groups}
			canResetCode={session.user.role === 'SUPER_ADMIN'}
		/>
	)
}
