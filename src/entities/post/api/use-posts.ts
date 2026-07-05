'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PostDto } from '@/entities/post/model/types'
import type { CreatePostInput, UpdatePostInput } from '@/shared/lib/validations/post'

async function parseApiJson<T>(res: Response): Promise<{ data: T | null; error: string | null }> {
	const text = await res.text()
	if (!text) {
		return { data: null, error: 'Пустой ответ сервера' }
	}
	try {
		return JSON.parse(text) as { data: T | null; error: string | null }
	} catch {
		return { data: null, error: 'Некорректный ответ сервера' }
	}
}

export function usePosts() {
	return useQuery<PostDto[]>({
		queryKey: ['posts'],
		queryFn: async () => {
			const res = await fetch('/api/posts')
			const json = await parseApiJson<PostDto[]>(res)
			if (json.error) throw new Error(json.error)
			return json.data ?? []
		},
	})
}

export function useCreatePost() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (payload: CreatePostInput) => {
			const res = await fetch('/api/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await parseApiJson<PostDto>(res)
			if (json.error) throw new Error(json.error)
			return json.data as PostDto
		},
		onSuccess: (created) => {
			queryClient.setQueryData<PostDto[]>(['posts'], (current) => [
				created,
				...(current ?? []),
			])
		},
	})
}

export function useUpdatePost() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: UpdatePostInput & { id: string }) => {
			const res = await fetch(`/api/posts/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await parseApiJson<PostDto>(res)
			if (json.error) throw new Error(json.error)
			if (!json.data) throw new Error('Не удалось обновить публикацию')
			return json.data
		},
		onSuccess: (updated) => {
			queryClient.setQueryData<PostDto[]>(['posts'], (current) =>
				current?.map((post) => (post.id === updated.id ? updated : post)) ?? [updated],
			)
		},
	})
}

export function useTogglePostLike() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (postId: string) => {
			const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
			const json = await parseApiJson<PostDto>(res)
			if (json.error) throw new Error(json.error)
			if (!json.data) throw new Error('Не удалось обновить лайк')
			return json.data
		},
		onSuccess: (updated) => {
			queryClient.setQueryData<PostDto[]>(['posts'], (current) =>
				current?.map((post) => (post.id === updated.id ? updated : post)),
			)
		},
	})
}

export function useDeletePost() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (postId: string) => {
			const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
			const json = await parseApiJson<{ ok: boolean }>(res)
			if (json.error) throw new Error(json.error)
			return postId
		},
		onSuccess: (postId) => {
			queryClient.setQueryData<PostDto[]>(['posts'], (current) =>
				current?.filter((post) => post.id !== postId) ?? [],
			)
		},
	})
}
