import { findTeachingSessionDatesInRange } from '@/features/journal/lib/teaching-session-queries'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { teachingSessionDatesQuerySchema } from '@/shared/lib/validations/teaching-session'
import { error, success } from '@/shared/api'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const parsed = teachingSessionDatesQuerySchema.safeParse({
		groupId: searchParams.get('groupId'),
		from: searchParams.get('from'),
		to: searchParams.get('to'),
	})
	if (!parsed.success) return error(parsed.error.message)

	const { groupId, from, to } = parsed.data
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER'],
		context: { groupId },
	})
	if ('error' in authResult) return authResult.error

	const teacherId = authResult.session.user.teacherId!
	const dates = await findTeachingSessionDatesInRange(
		teacherId,
		groupId,
		from,
		to,
	)

	return success({ dates })
}
