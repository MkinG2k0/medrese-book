import type { UserDetail } from '@/features/user-admin/ui/UserDetailModal'

export type LevelOption = {
	id: string
	number: number
	title: string
	steps: { id: string; order: number; title: string }[]
}

type UserWithRelations = {
	id: string
	name: string
	code: string
	role: string
	phone: string | null
	createdAt: Date
	teacher?: { groups: { name: string }[] } | null
	student?: {
		id: string
		fullName: string | null
		phone: string | null
		guardianPhone: string | null
		currentStepIdx: number
		levelId: string
		groupId: string
		level: { title: string }
		group?: { name: string } | null
	} | null
}

function getStepOffset(levels: LevelOption[], levelNumber: number): number {
	let offset = 0
	for (const level of levels) {
		if (level.number >= levelNumber) break
		offset += level.steps.length
	}
	return offset
}

export function mapUsersToDetails(
	users: UserWithRelations[],
	levels: LevelOption[],
): UserDetail[] {
	return users.map((user) => {
		const studentLevel = user.student
			? levels.find((level) => level.id === user.student!.levelId)
			: undefined
		const stepOffset = studentLevel
			? getStepOffset(levels, studentLevel.number)
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
}
