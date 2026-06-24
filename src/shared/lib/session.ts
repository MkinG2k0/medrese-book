import { cache } from 'react'
import { redirect } from 'next/navigation'

import type { Role } from '@/shared/lib/prisma'

import { auth } from './auth'

export const getCachedAuth = cache(auth)

export async function requireAuth() {
	const session = await getCachedAuth()
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
