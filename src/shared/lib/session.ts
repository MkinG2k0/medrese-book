import { redirect } from 'next/navigation'

import type { Role } from '../../../generated/prisma/client'

import { auth } from './auth'

export async function requireAuth() {
	const session = await auth()
	if (!session) redirect('/login')
	return session
}

export async function requireRole(role: Role) {
	const session = await requireAuth()
	if (session.user.role !== role) redirect('/login')
	return session
}

export async function requireRoles(roles: Role[]) {
	const session = await requireAuth()
	if (!roles.includes(session.user.role as Role)) redirect('/login')
	return session
}
