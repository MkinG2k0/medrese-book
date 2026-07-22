import { created, error, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { deliverNotifications } from '@/shared/lib/notifications/deliver-notifications'
import { postListSelect, toPostDto } from '@/shared/lib/posts/post-dto'
import { postVisibilityWhere } from '@/shared/lib/posts/post-visibility'
import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import { createPostSchema } from '@/shared/lib/validations/post'

export async function GET() {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT', 'ACCOUNTANT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	try {
		const posts = await prisma.post.findMany({
			where: postVisibilityWhere(session.user.role),
			orderBy: { publishedAt: 'desc' },
			select: postListSelect,
		})

		const likedRows = await prisma.postLike.findMany({
			where: {
				userId: session.user.id,
				postId: { in: posts.map((post) => post.id) },
			},
			select: { postId: true },
		})
		const likedPostIds = new Set(likedRows.map((row) => row.postId))

		return success(
			posts.map((post) => toPostDto(post, session.user.id, likedPostIds)),
		)
	} catch (err) {
		return serverError(err)
	}
}

export async function POST(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return error('Некорректный JSON')
	}

	const parsed = createPostSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	try {
		const result = await prisma.$transaction(async (tx) => {
			const createdPost = await tx.post.create({
				data: {
					title: parsed.data.title,
					body: parsed.data.body as Prisma.InputJsonValue,
					type: parsed.data.type,
					authorId: session.user.id,
					media: {
						create: parsed.data.media.map((item, index) => ({
							type: item.type,
							url: item.url,
							sortOrder: item.sortOrder ?? index,
						})),
					},
				},
				select: { id: true },
			})

			const post = await tx.post.findUniqueOrThrow({
				where: { id: createdPost.id },
				select: postListSelect,
			})

			const notifications = await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'POST_PUBLISHED',
					entityType: 'Post',
					entityId: post.id,
					payload: {
						postId: post.id,
						title: post.title,
						authorId: session.user.id,
						type: post.type,
					},
				},
				tx,
			)

			return { post, notifications }
		})

		void deliverNotifications(result.notifications)

		return created(
			toPostDto(result.post, session.user.id, new Set()),
		)
	} catch (err) {
		return serverError(err)
	}
}
