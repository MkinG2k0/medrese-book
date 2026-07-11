'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import type {
	ExtraAssignmentHistoryRow,
	ExtraAssignmentTemplate,
} from '@/entities/extra-assignment/model/types'
import type {
	AssignExtraAssignmentInput,
	CreateExtraAssignmentInput,
	GradeExtraAssignmentInput,
	UpdateExtraAssignmentInput,
} from '@/shared/lib/validations/extra-assignment'

export type ExtraAssignmentFilters = {
	authorId?: string
	stepId?: string
	levelId?: string
	title?: string
	subjectId?: string
}

export function useExtraAssignments(filters: ExtraAssignmentFilters = {}) {
	return useQuery<ExtraAssignmentTemplate[]>({
		queryKey: ['extra-assignments', filters],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (filters.authorId) params.set('authorId', filters.authorId)
			if (filters.stepId) params.set('stepId', filters.stepId)
			if (filters.levelId) params.set('levelId', filters.levelId)
			if (filters.title) params.set('title', filters.title)
			if (filters.subjectId) params.set('subjectId', filters.subjectId)
			const res = await fetch(`/api/extra-assignments?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}

export function useCreateExtraAssignment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (payload: CreateExtraAssignmentInput) => {
			const res = await fetch('/api/extra-assignments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data as ExtraAssignmentTemplate
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['extra-assignments'] })
		},
	})
}

export function useUpdateExtraAssignment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: UpdateExtraAssignmentInput & { id: string }) => {
			const res = await fetch(`/api/extra-assignments/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data as ExtraAssignmentTemplate
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['extra-assignments'] })
		},
	})
}

export function useDeleteExtraAssignment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/extra-assignments/${id}`, {
				method: 'DELETE',
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['extra-assignments'] })
		},
	})
}

export function useAssignExtraAssignment(studentId: string, date: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (payload: AssignExtraAssignmentInput) => {
			const res = await fetch('/api/extra-assignments/assign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['session-extra-assignments', studentId],
			})
		},
	})
}

export function useGradeExtraAssignment(studentId: string, date: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: GradeExtraAssignmentInput & { id: string }) => {
			const res = await fetch(`/api/extra-assignments/instances/${id}/grade`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['session-extra-assignments', studentId],
			})
			queryClient.invalidateQueries({
				queryKey: ['extra-assignment-history', studentId],
			})
		},
	})
}

export function useClearExtraAssignmentGrade(studentId: string, date: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/extra-assignments/instances/${id}/grade`, {
				method: 'DELETE',
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['session-extra-assignments', studentId],
			})
		},
	})
}

export function useStudentExtraAssignmentHistory(studentId?: string) {
	const { data: session } = useSession()
	const isStudent = session?.user?.role === 'STUDENT'
	const resolvedStudentId = isStudent ? session?.user?.studentId : studentId

	return useQuery<ExtraAssignmentHistoryRow[]>({
		queryKey: ['extra-assignment-history', resolvedStudentId ?? 'self'],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (!isStudent && studentId) {
				params.set('studentId', studentId)
			}
			const query = params.toString()
			const res = await fetch(
				`/api/extra-assignments/history${query ? `?${query}` : ''}`,
			)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: isStudent ? !!session?.user?.studentId : !!studentId,
	})
}
