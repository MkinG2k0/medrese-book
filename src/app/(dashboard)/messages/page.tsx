import { Suspense } from 'react'

import { MessagesPage } from '@/features/messaging'
import { MESSAGING_ROLES } from '@/shared/lib/messaging/roles'
import { requireRoles } from '@/shared/lib/session'

export default async function MessagesRoutePage() {
	await requireRoles([...MESSAGING_ROLES])
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Suspense fallback={null}>
				<MessagesPage />
			</Suspense>
		</div>
	)
}
