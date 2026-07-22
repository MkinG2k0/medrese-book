import { error, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { postListSelect, toPostDto } from '@/shared/lib/posts/post-dto'
import { assertPostVisibleToRole } from '@/shared/lib/posts/post-visibility'
import { prisma } from '@/shared/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT', 'ACCOUNTANT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const { id } = await context.params

	try {
		const post = await prisma.post.findUnique({
			where: { id },
			select: { id: true, type: true },
		})
		if (!post || !assertPostVisibleToRole(post.type, session.user.role)) {
			return error('Публикация не найдена', 404)
		}

		const existing = await prisma.postLike.findUnique({
			where: {
				postId_userId: { postId: id, userId: session.user.id },
			},
		})

		if (existing) {
			await prisma.postLike.delete({ where: { id: existing.id } })
		} else {
			await prisma.postLike.create({
				data: { postId: id, userId: session.user.id },
			})
		}

		const updated = await prisma.post.findUniqueOrThrow({
			where: { id },
			select: postListSelect,
		})

		const liked = await prisma.postLike.findUnique({
			where: {
				postId_userId: { postId: id, userId: session.user.id },
			},
			select: { id: true },
		})

		return success(
			toPostDto(updated, session.user.id, new Set(liked ? [id] : [])),
		)
	} catch (err) {
		return serverError(err)
	}
}
