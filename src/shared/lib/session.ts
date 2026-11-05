import { cache } from 'react'
import { redirect } from 'next/navigation'

import type { UserRole } from '@/entities/user'
import { getDefaultRedirect } from '@/shared/lib/get-default-redirect'
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
	if (session.user.role !== role) {
		redirect(getDefaultRedirect(session.user.role as UserRole))
	}
	return session
}

export async function requireRoles(roles: Role[]) {
	const session = await requireAuth()
	if (!roles.includes(session.user.role as Role)) {
		redirect(getDefaultRedirect(session.user.role as UserRole))
	}
	return session
}
