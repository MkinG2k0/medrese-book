import { useQuery } from '@tanstack/react-query'

type ApiResponse<T> = { data: T | null; error: string | null }

type TeachingSessionDatesResponse = {
	dates: string[]
}

async function fetchTeachingSessionDates(
	groupId: string,
	from: string,
	to: string,
): Promise<string[]> {
	const params = new URLSearchParams({ groupId, from, to })
	const res = await fetch(`/api/teaching-sessions/dates?${params}`)
	const json = (await res.json()) as ApiResponse<TeachingSessionDatesResponse>
	if (json.error) throw new Error(json.error)
	return json.data?.dates ?? []
}

export function teachingSessionDatesQueryKey(
	groupId: string,
	from: string,
	to: string,
) {
	return ['teaching-session-dates', groupId, from, to] as const
}

export function useTeachingSessionDates(
	groupId: string,
	from: string,
	to: string,
) {
	return useQuery({
		queryKey: teachingSessionDatesQueryKey(groupId, from, to),
		queryFn: () => fetchTeachingSessionDates(groupId, from, to),
		enabled: Boolean(groupId && from && to && from <= to),
		staleTime: 60_000,
	})
}
