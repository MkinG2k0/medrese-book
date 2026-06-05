import { redirect } from 'next/navigation'

import { auth } from '@/shared/lib/auth'

export default async function DashboardPage() {
	const session = await auth()
	if (!session) redirect('/login')

	switch (session.user.role) {
		case 'TEACHER':
			redirect('/journal')
		case 'STUDENT':
			redirect('/student/me')
		case 'MANAGER':
		case 'SUPER_ADMIN':
			redirect('/admin/users')
		default:
			redirect('/login')
	}
}
