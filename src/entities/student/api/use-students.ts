'use client'

import { useQuery } from '@tanstack/react-query'

type Student = {
	id: string
	name: string
	currentStepIdx: number
	groupId: string
	hasSessionToday?: boolean
}

export function useStudents(groupId?: string, date?: string) {
	return useQuery<Student[]>({
		queryKey: ['students', groupId, date],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (groupId) params.set('groupId', groupId)
			if (date) params.set('date', date)
			const res = await fetch(`/api/students?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: !!groupId,
	})
}
