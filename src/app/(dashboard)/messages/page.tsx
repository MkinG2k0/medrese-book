import { MessagesPage } from '@/features/messaging'
import { requireRoles } from '@/shared/lib/session'

export default async function MessagesRoutePage() {
	await requireRoles(['TEACHER', 'MANAGER', 'STUDENT'])
	return <MessagesPage />
}
