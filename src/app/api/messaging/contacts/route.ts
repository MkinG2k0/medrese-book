import { success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { getMessageableContacts } from '@/shared/lib/messaging/can-message-user'
import { MESSAGING_ROLES } from '@/shared/lib/messaging/roles'

export async function GET() {
	const authResult = await authorizeApiRequest({
		allowedRoles: [...MESSAGING_ROLES],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	const contacts = await getMessageableContacts(session)

	return success(contacts)
}
