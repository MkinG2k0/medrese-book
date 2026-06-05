import { prisma } from '@/shared/lib/prisma'

export async function generateUniqueCode(): Promise<string> {
	let code: string
	let exists = true

	while (exists) {
		code = Math.floor(100000 + Math.random() * 900000).toString()
		const user = await prisma.user.findUnique({ where: { code } })
		exists = !!user
	}

	return code!
}
