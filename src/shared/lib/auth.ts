import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

import type { UserRole } from '@/entities/user'
import { authConfig } from '@/shared/lib/auth.config'
import { prisma } from '@/shared/lib/prisma'

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

const loginSchema = z.object({
	code: z.string().length(6).regex(/^\d{6}$/),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	secret: authSecret,
	providers: [
		Credentials({
			id: 'code',
			name: 'Код доступа',
			credentials: {
				code: { label: 'Код доступа', type: 'text' },
			},
			async authorize(credentials) {
				const rawCode = credentials?.code
				if (typeof rawCode !== 'string') return null

				const parsed = loginSchema.safeParse({
					code: rawCode.replace(/\D/g, ''),
				})
				if (!parsed.success) return null

				const user = await prisma.user.findUnique({
					where: { code: parsed.data.code },
					include: { teacher: true, student: true },
				})
				if (!user) return null

				return {
					id: user.id,
					name: user.name,
					role: user.role as UserRole,
					teacherId: user.teacher?.id ?? null,
					studentId: user.student?.id ?? null,
				}
			},
		}),
	],
})
