import type { UserDetail } from '@/features/user-admin/ui/UserDetailModal'
import type { StudentStatus } from '@/shared/lib/student-status'

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
		guardianName: string | null
		guardianPhone: string | null
		status: StudentStatus
		enrollments: {
			groupId: string
			levelId: string
			currentStepIdx: number
			enrolledAt?: Date
			group: { name: string }
			level: { title: string; number?: number }
		}[]
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

function getPrimaryEnrollment(
	enrollments: NonNullable<UserWithRelations['student']>['enrollments'],
) {
	if (enrollments.length === 0) return undefined
	return [...enrollments].sort(
		(a, b) => (a.enrolledAt?.getTime() ?? 0) - (b.enrolledAt?.getTime() ?? 0),
	)[0]
}

function formatGroupNames(
	enrollments: NonNullable<UserWithRelations['student']>['enrollments'],
): string | undefined {
	if (enrollments.length === 0) return undefined
	if (enrollments.length === 1) return enrollments[0]!.group.name
	return `${enrollments.length} групп`
}

export function mapUsersToDetails(
	users: UserWithRelations[],
	levels: LevelOption[],
): UserDetail[] {
	return users.map((user) => {
		const enrollments = user.student?.enrollments ?? []
		const primaryEnrollment = getPrimaryEnrollment(enrollments)

		const studentLevel = primaryEnrollment
			? levels.find((level) => level.id === primaryEnrollment.levelId)
			: undefined
		const stepOffset = studentLevel
			? getStepOffset(levels, studentLevel.number)
			: 0
		const stepCount = studentLevel?.steps.length ?? 0
		const enrollmentStepIdx = primaryEnrollment?.currentStepIdx ?? 0
		const localStepIndex =
			user.student && studentLevel
				? Math.min(
						Math.max(0, enrollmentStepIdx - stepOffset),
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
			groupName: formatGroupNames(enrollments),
			teacherGroupNames: user.teacher?.groups.map((group) => group.name),
			student: user.student
				? {
						id: user.student.id,
						fullName: user.student.fullName ?? undefined,
						phone: user.student.phone ?? undefined,
						guardianName: user.student.guardianName ?? undefined,
						guardianPhone: user.student.guardianPhone ?? undefined,
						currentStepIdx: enrollmentStepIdx,
						levelId: primaryEnrollment?.levelId ?? '',
						levelTitle: primaryEnrollment?.level.title,
						groupId: primaryEnrollment?.groupId ?? '',
						localStepIndex,
						status: user.student.status,
						enrollmentGroups: enrollments.map((enrollment) => ({
							groupId: enrollment.groupId,
							groupName: enrollment.group.name,
							levelId: enrollment.levelId,
							levelTitle: enrollment.level.title,
						})),
					}
				: undefined,
		}
	})
}
