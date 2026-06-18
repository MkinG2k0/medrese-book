'use server'

import { z } from 'zod'

import { signIn } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

const loginCodeSchema = z.object({
	code: z.string().length(6).regex(/^\d{6}$/),
})

export type LoginResult =
	| { ok: true }
	| { ok: false; error: string }

export async function loginWithCode(rawCode: string): Promise<LoginResult> {
	const parsed = loginCodeSchema.safeParse({
		code: rawCode.replace(/\D/g, ''),
	})
	if (!parsed.success) {
		return { ok: false, error: 'Неверный код доступа' }
	}

	const user = await prisma.user.findUnique({
		where: { code: parsed.data.code },
		select: { id: true },
	})
	if (!user) {
		return { ok: false, error: 'Неверный код доступа' }
	}

	await signIn('code', { code: parsed.data.code, redirect: false })
	return { ok: true }
}
