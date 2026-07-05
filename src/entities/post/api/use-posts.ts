'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PostDto } from '@/entities/post/model/types'
import type { CreatePostInput } from '@/shared/lib/validations/post'

export function usePosts() {
	return useQuery<PostDto[]>({
		queryKey: ['posts'],
		queryFn: async () => {
			const res = await fetch('/api/posts')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
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
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data as PostDto
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['posts'] })
		},
	})
}

export function useTogglePostLike() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (postId: string) => {
			const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data as PostDto
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
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return postId
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['posts'] })
		},
	})
}
