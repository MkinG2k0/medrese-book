export function resolveTeachingSessionStart(
	existing: { endedAt: Date | null } | null,
):
	| { action: 'create' }
	| { action: 'resume'; session: { endedAt: Date | null } }
	| { action: 'already_ended' } {
	if (!existing) return { action: 'create' }
	if (existing.endedAt == null) return { action: 'resume', session: existing }
	return { action: 'already_ended' }
}
