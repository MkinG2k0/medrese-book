import type { UserRole } from '@/entities/user'

const ROLE_LABELS: Record<UserRole, string> = {
	SUPER_ADMIN: 'Админ',
	MANAGER: 'Менеджер',
	TEACHER: 'Учитель',
	STUDENT: 'Ученик',
}

export const TEACHER_SUBSTITUTION_ROLE_LABEL = 'Учитель — Замещение'

type RoleLabelOptions = {
	isSubstituting?: boolean
	isSubstitutionTarget?: boolean
}

export function getDisplayRoleLabel(
	role: UserRole | string,
	options: RoleLabelOptions = {},
): string {
	if (
		role === 'TEACHER' &&
		(options.isSubstituting || options.isSubstitutionTarget)
	) {
		return TEACHER_SUBSTITUTION_ROLE_LABEL
	}

	return ROLE_LABELS[role as UserRole] ?? role
}

export function getRoleLabelsMap(): Record<UserRole, string> {
	return { ...ROLE_LABELS }
}
