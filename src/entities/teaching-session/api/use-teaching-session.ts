import type { TeachingSessionDto } from '@/features/journal/lib/teaching-session'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type ApiResponse<T> = { data: T | null; error: string | null }

async function fetchTeachingSession(
	groupId: string,
	date: string,
): Promise<TeachingSessionDto | null> {
	const params = new URLSearchParams({ groupId, date })
	const res = await fetch(`/api/teaching-sessions?${params}`)
	const json = (await res.json()) as ApiResponse<TeachingSessionDto | null>
	if (json.error) throw new Error(json.error)
	return json.data
}

export function useTeachingSession(groupId: string, date: string) {
	return useQuery({
		queryKey: ['teaching-session', groupId, date],
		queryFn: () => fetchTeachingSession(groupId, date),
		enabled: Boolean(groupId && date),
		refetchInterval: (query) =>
			query.state.data?.isActive ? 30_000 : false,
	})
}

export function useStartTeachingSession(groupId: string, date: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const res = await fetch('/api/teaching-sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ groupId, date }),
			})
			const json = (await res.json()) as ApiResponse<TeachingSessionDto>
			if (json.error) throw new Error(json.error)
			return json.data!
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ['teaching-session', groupId, date],
			})
		},
	})
}

export function useEndTeachingSession(groupId: string, date: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (sessionId: string) => {
			const res = await fetch(`/api/teaching-sessions/${sessionId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'end' }),
			})
			const json = (await res.json()) as ApiResponse<TeachingSessionDto>
			if (json.error) throw new Error(json.error)
			return json.data!
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ['teaching-session', groupId, date],
			})
		},
	})
}
