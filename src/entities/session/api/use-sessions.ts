'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type CreateSessionPayload = {
	studentId: string
	date: string
	attendance: 'PRESENT' | 'LATE' | 'ABSENT'
	lateMinutes?: number | null
	note?: string | null
	completions: { stepId: string; grade: number; note?: string | null }[]
}

export function useCreateSession() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (payload: CreateSessionPayload) => {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['students'] })
		},
	})
}
