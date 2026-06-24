'use client'

import { signOut as nextAuthSignOut } from 'next-auth/react'

import type { UserRole } from '@/entities/user'

type SignOutOptions = {
	callbackUrl?: string
	role?: UserRole
	userId?: string
	endActiveLesson?: boolean
}

async function endActiveTeachingSessionIfNeeded(role?: UserRole) {
	if (role !== 'TEACHER') return

	try {
		await fetch('/api/teaching-sessions/end-active', { method: 'POST' })
	} catch {
		// logout should proceed even if lesson end fails
	}
}

async function recordLogoutIfNeeded(userId?: string, role?: UserRole) {
	if (!userId || !role) return

	try {
		await fetch('/api/auth/logout-audit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, role }),
		})
	} catch {
		// ignore audit failures on logout
	}
}

export async function signOutWithLessonCleanup(options: SignOutOptions = {}) {
	const {
		callbackUrl = '/login',
		role,
		userId,
		endActiveLesson = true,
	} = options

	if (endActiveLesson) {
		await endActiveTeachingSessionIfNeeded(role)
	}
	await recordLogoutIfNeeded(userId, role)
	await nextAuthSignOut({ callbackUrl })
}
