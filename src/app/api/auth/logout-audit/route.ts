import { z } from 'zod'

import { recordUserLogout } from '@/features/auth/lib/auth-audit'
import { auth } from '@/shared/lib/auth'
import type { UserRole } from '@/entities/user'
import { error, forbidden, success, unauthorized } from '@/shared/api'

const logoutAuditSchema = z.object({
	userId: z.string(),
	role: z.enum(['SUPER_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']),
})

export async function POST(request: Request) {
	const session = await auth()
	if (!session?.user) return unauthorized()

	const body = await request.json()
	const parsed = logoutAuditSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	if (parsed.data.userId !== session.user.id) {
		return forbidden()
	}

	await recordUserLogout(
		parsed.data.userId,
		parsed.data.role as UserRole,
	)

	return success({ ok: true })
}
