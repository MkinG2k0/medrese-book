import { TeacherLeaveCalendarPage } from '@/features/leave-requests/ui/TeacherLeaveCalendarPage'
import { requireRole } from '@/shared/lib/session'

export default async function CalendarPage() {
	await requireRole('TEACHER')
	return <TeacherLeaveCalendarPage />
}
