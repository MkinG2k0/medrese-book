export function canEditGroup(
	role: string,
	teacherId: string | null,
	groupTeacherId: string,
): boolean {
	if (role === 'SUPER_ADMIN' || role === 'MANAGER') return true
	if (role === 'TEACHER' && teacherId === groupTeacherId) return true
	return false
}
