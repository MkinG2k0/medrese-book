import { z } from 'zod'

const auditEventQuerySchema = z.object({
	action: z.string().optional(),
	entityType: z.string().optional(),
	actorId: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export type AuditEventQueryInput = z.infer<typeof auditEventQuerySchema>

export function parseAuditEventQuery(
	searchParams: URLSearchParams,
): AuditEventQueryInput {
	return auditEventQuerySchema.parse({
		action: searchParams.get('action') ?? undefined,
		entityType: searchParams.get('entityType') ?? undefined,
		actorId: searchParams.get('actorId') ?? undefined,
		from: searchParams.get('from') ?? undefined,
		to: searchParams.get('to') ?? undefined,
		page: searchParams.get('page') ?? undefined,
		pageSize: searchParams.get('pageSize') ?? undefined,
	})
}
