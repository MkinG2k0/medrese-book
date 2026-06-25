import { MessagesPage } from '@/features/messaging'
import { requireRoles } from '@/shared/lib/session'

export default async function MessagesRoutePage() {
	await requireRoles(['TEACHER', 'MANAGER', 'STUDENT'])
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<MessagesPage />
		</div>
	)
}
