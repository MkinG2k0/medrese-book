import { redirect } from 'next/navigation'

import type { Role } from '../../../generated/prisma/client'

import { auth } from './auth'

export async function requireRole(role: Role) {
	const session = await auth()
	if (!session) redirect('/login')
	if (session.user.role !== role) redirect('/login')
	return session
}
