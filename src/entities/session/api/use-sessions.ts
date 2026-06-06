'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Attendance = 'PRESENT' | 'LATE' | 'ABSENT'

type CreateSessionPayload = {
	studentId: string
	date: string
	attendance: Attendance
	lateMinutes?: number | null
	note?: string | null
	completions: { stepId: string; grade: number; note?: string | null }[]
}

export type StudentSession = {
	id: string
	studentId: string
	date: string
	attendance: Attendance
	lateMinutes: number | null
	note: string | null
	completions: {
		stepId: string
		grade: number
		note: string | null
		step?: {
			id: string
			order: number
			title: string
			type: 'LETTER' | 'SURAH'
			content: unknown
			hours: number
			level: { number: number; title: string }
		}
	}[]
}

export function useStudentSession(studentId: string, date: string) {
	return useQuery<StudentSession | null>({
		queryKey: ['student-session', studentId, date],
		queryFn: async () => {
			const params = new URLSearchParams({ studentId, date })
			const res = await fetch(`/api/sessions?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: !!studentId && !!date,
	})
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
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['students'] })
			queryClient.invalidateQueries({
				queryKey: [
					'student-session',
					variables.studentId,
					variables.date.slice(0, 10),
				],
			})
		},
	})
}
