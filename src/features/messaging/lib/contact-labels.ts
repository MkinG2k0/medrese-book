import { getDisplayRoleLabel } from '@/features/auth/lib/role-labels'
import type { MessageContact } from '@/entities/conversation'

export function getContactRoleLabel(role: string): string {
	return getDisplayRoleLabel(role)
}

export function contactSubtitle(contact: MessageContact): string {
	return getContactRoleLabel(contact.role)
}
