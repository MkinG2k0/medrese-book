import { success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { getMessageableContacts } from '@/shared/lib/messaging/can-message-user'

export async function GET() {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	const contacts = await getMessageableContacts(session)

	return success(contacts)
}
