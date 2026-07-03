'use client'

import { useQuery } from '@tanstack/react-query'

import type { SalaryRow, TeacherLessonRow } from '@/entities/accounting/model/types'

export function useSalaries(month: string) {
	return useQuery<SalaryRow[]>({
		queryKey: ['accounting-salaries', month],
		queryFn: async () => {
			const res = await fetch(`/api/accounting/salaries?month=${month}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}

export function useTeacherLessons(month: string, teacherId: string | null) {
	return useQuery<TeacherLessonRow[]>({
		queryKey: ['accounting-teacher-lessons', month, teacherId],
		enabled: Boolean(teacherId),
		queryFn: async () => {
			const params = new URLSearchParams({ month, teacherId: teacherId! })
			const res = await fetch(`/api/accounting/salaries?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
