import type { PostMediaType, PostType, Prisma } from '@/shared/lib/prisma'

export type PostMediaDto = {
	id: string
	type: PostMediaType
	url: string
	sortOrder: number
}

export type PostAuthorDto = {
	id: string
	name: string
}

export type PostDto = {
	id: string
	title: string
	body: Prisma.JsonValue
	type: PostType
	author: PostAuthorDto
	publishedAt: string
	updatedAt: string
	likeCount: number
	likedByMe: boolean
	media: PostMediaDto[]
}

export function toPostDto(
	post: {
		id: string
		title: string
		body: Prisma.JsonValue
		type: PostType
		publishedAt: Date
		updatedAt: Date
		author: { id: string; name: string }
		media: Array<{
			id: string
			type: PostMediaType
			url: string
			sortOrder: number
		}>
		_count: { likes: number }
	},
	currentUserId: string,
	likedPostIds: Set<string>,
): PostDto {
	return {
		id: post.id,
		title: post.title,
		body: post.body,
		type: post.type,
		author: post.author,
		publishedAt: post.publishedAt.toISOString(),
		updatedAt: post.updatedAt.toISOString(),
		likeCount: post._count.likes,
		likedByMe: likedPostIds.has(post.id),
		media: post.media.map((item) => ({
			id: item.id,
			type: item.type,
			url: item.url,
			sortOrder: item.sortOrder,
		})),
	}
}

export const postListSelect = {
	id: true,
	title: true,
	body: true,
	type: true,
	publishedAt: true,
	updatedAt: true,
	author: { select: { id: true, name: true } },
	media: {
		orderBy: { sortOrder: 'asc' as const },
		select: {
			id: true,
			type: true,
			url: true,
			sortOrder: true,
		},
	},
	_count: { select: { likes: true } },
} satisfies Prisma.PostSelect
