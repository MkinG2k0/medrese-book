'use server'

import type { AuditFilterOptions } from '@/entities/audit-event/model/types'
import {
	buildAuditActionOptions,
	buildAuditEntityTypeOptions,
	getAuditEntityTypeLabel,
} from '@/features/audit-log/lib/audit-labels'
import {
	queryAuditActorOptions,
	queryDistinctEntityTypes,
} from '@/features/audit-log/lib/query-audit-events'
import { requireRoles } from '@/shared/lib/session'

export async function getAuditFilterOptions(): Promise<AuditFilterOptions> {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const [actors, distinctEntityTypes] = await Promise.all([
		queryAuditActorOptions(),
		queryDistinctEntityTypes(),
	])

	const knownOptions = buildAuditEntityTypeOptions()
	const knownValues = new Set(knownOptions.map((option) => option.value))
	const extraEntityTypes = distinctEntityTypes
		.filter((value) => !knownValues.has(value))
		.map((value) => ({
			value,
			label: getAuditEntityTypeLabel(value),
		}))

	return {
		actions: buildAuditActionOptions(),
		entityTypes: [...knownOptions, ...extraEntityTypes].sort((a, b) =>
			a.label.localeCompare(b.label, 'ru'),
		),
		actors,
	}
}
