'use server'

import { prisma } from '@/shared/lib/prisma'

export async function getUserInfoByCode(code: string) {
	const user = await prisma.user.findUnique({
		where: { code },
		select: { id: true, name: true, role: true },
	})
	return user
}
