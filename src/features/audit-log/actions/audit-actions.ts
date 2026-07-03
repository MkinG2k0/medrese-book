'use server'

import type { AuditFilterOptions } from '@/entities/audit-event/model/types'
import {
	buildAuditActionOptions,
	buildAuditEntityTypeOptions,
} from '@/features/audit-log/lib/audit-labels'
import { queryAuditActorOptions } from '@/features/audit-log/lib/query-audit-events'
import { requireRoles } from '@/shared/lib/session'

export async function getAuditFilterOptions(): Promise<AuditFilterOptions> {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const actors = await queryAuditActorOptions()

	return {
		actions: buildAuditActionOptions(),
		entityTypes: buildAuditEntityTypeOptions(),
		actors,
	}
}
