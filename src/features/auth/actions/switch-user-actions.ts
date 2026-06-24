'use server'

import { redirect } from 'next/navigation'

import { auth, signIn } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

import { resolveSwitchAccess } from '../lib/resolve-switch-access'

export type SwitchableUser = {
	id: string
	name: string
	role: string
}

export async function getSwitchableUsers(): Promise<SwitchableUser[]> {
	const session = await auth()
	if (!session) return []

	const access = await resolveSwitchAccess(session)
	if (!access.allowed) return []

	return prisma.user.findMany({
		where: { role: { not: 'STUDENT' } },
		select: { id: true, name: true, role: true },
		orderBy: [{ role: 'asc' }, { name: 'asc' }],
	})
}

export async function switchUser(userId: string) {
	const session = await auth()
	if (!session) throw new Error('Недостаточно прав')

	const access = await resolveSwitchAccess(session)
	if (!access.allowed || !access.switchOwnerId) {
		throw new Error('Недостаточно прав')
	}

	if (userId === session.user.id) return

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
	redirect('/dashboard')
}
