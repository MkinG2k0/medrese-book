import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

import type { UserRole } from '@/entities/user'
import { authConfig } from '@/shared/lib/auth.config'
import { prisma } from '@/shared/lib/prisma'
import { getActiveSubstitutionsForSubstitute } from '@/shared/lib/substitution-access'

const loginSchema = z.object({
	code: z.string().length(6).regex(/^\d{6}$/),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	providers: [
		Credentials({
			id: 'code',
			name: 'Код доступа',
			credentials: {
				code: { label: 'Код доступа', type: 'text' },
				switchOwnerId: { label: 'Switch owner', type: 'text' },
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

				let switchOwnerId: string | null = null
				const rawSwitchOwnerId = credentials?.switchOwnerId
				if (typeof rawSwitchOwnerId === 'string' && rawSwitchOwnerId) {
					const owner = await prisma.user.findUnique({
						where: { id: rawSwitchOwnerId },
						select: { role: true, teacher: { select: { id: true } } },
					})

					if (owner && rawSwitchOwnerId !== user.id) {
						if (owner.role === 'SUPER_ADMIN' || owner.role === 'MANAGER') {
							switchOwnerId = rawSwitchOwnerId
						} else if (
							owner.role === 'TEACHER' &&
							owner.teacher?.id &&
							user.teacher
						) {
							const active = await getActiveSubstitutionsForSubstitute(
								owner.teacher.id,
							)
							if (
								active.some(
									(substitution) =>
										substitution.absentTeacherId === user.teacher!.id,
								)
							) {
								switchOwnerId = rawSwitchOwnerId
							}
						}
					}
				}

				return {
					id: user.id,
					name: user.name,
					role: user.role as UserRole,
					teacherId: user.teacher?.id ?? null,
					studentId: user.student?.id ?? null,
					switchOwnerId,
				}
			},
		}),
	],
})
