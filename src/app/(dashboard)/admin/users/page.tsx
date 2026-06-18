import { getLevelsForCreateUser, getUsers } from '@/features/user-admin/actions/user-actions'
import { UsersTable } from '@/features/user-admin/ui/UsersTable'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

function getStepOffset(
	levels: { number: number; steps: unknown[] }[],
	levelNumber: number,
): number {
	let offset = 0
	for (const level of levels) {
		if (level.number >= levelNumber) break
		offset += level.steps.length
	}
	return offset
}

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

	const rows = users.map((user) => {
		const studentLevel = user.student
			? levelOptions.find((level) => level.id === user.student!.levelId)
			: undefined
		const stepOffset = studentLevel
			? getStepOffset(levelOptions, studentLevel.number)
			: 0
		const stepCount = studentLevel?.steps.length ?? 0
		const localStepIndex =
			user.student && studentLevel
				? Math.min(
						Math.max(0, user.student.currentStepIdx - stepOffset),
						Math.max(0, stepCount - 1),
					)
				: 0

		return {
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
						id: user.student.id,
						fullName: user.student.fullName ?? undefined,
						phone: user.student.phone ?? undefined,
						guardianPhone: user.student.guardianPhone ?? undefined,
						currentStepIdx: user.student.currentStepIdx,
						levelId: user.student.levelId,
						levelTitle: user.student.level.title,
						groupId: user.student.groupId,
						localStepIndex,
					}
				: undefined,
		}
	})

	return (
		<UsersTable
			users={rows}
			groups={groups}
			levels={levelOptions}
			canResetCode={session.user.role === 'SUPER_ADMIN'}
		/>
	)
}
