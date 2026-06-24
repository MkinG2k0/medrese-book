import { canSubstituteAccessGroup } from '@/shared/lib/substitution-access'

export function canEditGroup(
	role: string,
	teacherId: string | null,
	groupTeacherId: string,
): boolean {
	if (role === 'SUPER_ADMIN' || role === 'MANAGER') return true
	if (role === 'TEACHER' && teacherId === groupTeacherId) return true
	return false
}

export async function canAccessGroupAsTeacher(
	teacherId: string | null,
	groupTeacherId: string,
): Promise<boolean> {
	if (!teacherId) return false
	if (teacherId === groupTeacherId) return true
	return canSubstituteAccessGroup(teacherId, groupTeacherId)
}
