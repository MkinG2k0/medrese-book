import { AuditLogPage } from '@/features/audit-log'
import { requireRoles } from '@/shared/lib/session'

export default async function AdminAuditLogPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return <AuditLogPage />
}
