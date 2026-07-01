'use client'

import { useQuery } from '@tanstack/react-query'

import type {
	AtRiskStudentApiRow,
	StudentMetricsResponse,
	StudentRiskFlagEntry,
} from '../model/types'

export function useStudentMetrics(studentId?: string, month?: string) {
	return useQuery<StudentMetricsResponse>({
		queryKey: ['student-metrics', studentId, month],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (studentId) params.set('studentId', studentId)
			if (month) params.set('month', month)
			const res = await fetch(`/api/student-metrics?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: !!studentId,
	})
}

export function useAtRiskStudents(month?: string, teacherId?: string | null) {
	return useQuery<AtRiskStudentApiRow[]>({
		queryKey: ['at-risk-students', month, teacherId ?? 'all'],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (month) params.set('month', month)
			if (teacherId) params.set('teacher', teacherId)
			const res = await fetch(`/api/at-risk-students?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}

export function useStudentRiskFlags(groupId?: string, date?: string) {
	return useQuery<StudentRiskFlagEntry[]>({
		queryKey: ['student-risk-flags', groupId, date],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (groupId) params.set('groupId', groupId)
			if (date) params.set('date', date)
			const res = await fetch(`/api/students/risk-flags?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: !!groupId && !!date,
	})
}
