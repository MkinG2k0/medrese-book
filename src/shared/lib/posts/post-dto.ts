import type { PostMediaType, Prisma } from '@/shared/lib/prisma'

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
	author: PostAuthorDto
	publishedAt: string
	likeCount: number
	likedByMe: boolean
	media: PostMediaDto[]
}

export function toPostDto(
	post: {
		id: string
		title: string
		body: Prisma.JsonValue
		publishedAt: Date
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
		author: post.author,
		publishedAt: post.publishedAt.toISOString(),
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
	publishedAt: true,
	author: { select: { id: true, name: true } },
	media: { orderBy: { sortOrder: 'asc' as const } },
	_count: { select: { likes: true } },
} satisfies Prisma.PostSelect
