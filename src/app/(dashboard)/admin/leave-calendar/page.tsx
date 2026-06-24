import { ManagerLeaveCalendarPage } from '@/features/leave-requests/ui/ManagerLeaveCalendarPage'
import { requireRoles } from '@/shared/lib/session'

export default async function AdminLeaveCalendarPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return <ManagerLeaveCalendarPage />
}
