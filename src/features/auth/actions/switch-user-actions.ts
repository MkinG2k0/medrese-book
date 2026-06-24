'use server'

import { redirect } from 'next/navigation'

import { auth, signIn } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

import { canSwitchUser } from '../lib/can-switch-user'

export type SwitchableUser = {
	id: string
	name: string
	role: string
}

export async function getSwitchableUsers(): Promise<SwitchableUser[]> {
	const session = await auth()
	if (!session || !canSwitchUser(session.user.role)) return []

	return prisma.user.findMany({
		where: { role: { not: 'STUDENT' } },
		select: { id: true, name: true, role: true },
		orderBy: [{ role: 'asc' }, { name: 'asc' }],
	})
}

export async function switchUser(userId: string) {
	const session = await auth()
	if (!session || !canSwitchUser(session.user.role)) {
		throw new Error('Недостаточно прав')
	}

	if (userId === session.user.id) return

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { code: true, role: true },
	})
	if (!user) throw new Error('Пользователь не найден')
	if (user.role === 'STUDENT') throw new Error('Недостаточно прав')

	await signIn('code', { code: user.code, redirect: false })
	redirect('/dashboard')
}
