'use server'

import { redirect } from 'next/navigation'

import type { UserRole } from '@/entities/user'
import { signIn } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { getSubstitutableTeacherUserIds } from '@/shared/lib/substitution-access'
import { getCachedAuth } from '@/shared/lib/session'

import { resolveSwitchAccess } from '../lib/resolve-switch-access'
import { recordUserLogin } from '../lib/auth-audit'

export type SwitchableUser = {
	id: string
	name: string
	role: string
}

async function getTeacherSwitchUserIds(session: {
	user: {
		id: string
		role: string
		teacherId: string | null
		switchOwnerId: string | null
	}
}): Promise<string[]> {
	const substituteUserId = session.user.switchOwnerId ?? session.user.id
	let substituteTeacherId = session.user.teacherId

	if (session.user.switchOwnerId) {
		const owner = await prisma.user.findUnique({
			where: { id: session.user.switchOwnerId },
			select: { teacher: { select: { id: true } } },
		})
		substituteTeacherId = owner?.teacher?.id ?? null
	}

	if (!substituteTeacherId) {
		return [session.user.id]
	}

	const absentTeacherUserIds =
		await getSubstitutableTeacherUserIds(substituteTeacherId)

	return [...new Set([substituteUserId, ...absentTeacherUserIds])]
}

export async function getSwitchableUsers(): Promise<SwitchableUser[]> {
	const session = await getCachedAuth()
	if (!session) return []

	const access = await resolveSwitchAccess(session)
	if (!access.allowed) return []

	const role = session.user.role as UserRole

	if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
		return prisma.user.findMany({
			where: { role: { not: 'STUDENT' } },
			select: { id: true, name: true, role: true },
			orderBy: [{ role: 'asc' }, { name: 'asc' }],
		})
	}

	if (role === 'TEACHER') {
		const allowedUserIds = await getTeacherSwitchUserIds(session)
		return prisma.user.findMany({
			where: { id: { in: allowedUserIds } },
			select: { id: true, name: true, role: true },
			orderBy: [{ role: 'asc' }, { name: 'asc' }],
		})
	}

	return []
}

export async function switchUser(userId: string) {
	const session = await getCachedAuth()
	if (!session) throw new Error('Недостаточно прав')

	const access = await resolveSwitchAccess(session)
	if (!access.allowed || !access.switchOwnerId) {
		throw new Error('Недостаточно прав')
	}

	if (userId === session.user.id) return

	const allowedUsers = await getSwitchableUsers()
	if (!allowedUsers.some((user) => user.id === userId)) {
		throw new Error('Недостаточно прав')
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { code: true, role: true },
	})
	if (!user) throw new Error('Пользователь не найден')
	if (user.role === 'STUDENT') throw new Error('Недостаточно прав')

	const switchOwnerId =
		userId === access.switchOwnerId ? undefined : access.switchOwnerId

	await signIn('code', {
		code: user.code,
		switchOwnerId,
		redirect: false,
	})
	await recordUserLogin(userId, user.role as UserRole, {
		switchOwnerId: switchOwnerId ?? access.switchOwnerId,
	})
	redirect('/dashboard')
}
