import { error, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { postListSelect, toPostDto } from '@/shared/lib/posts/post-dto'
import { prisma } from '@/shared/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const { id } = await context.params

	try {
		const post = await prisma.post.findUnique({
			where: { id },
			select: { id: true },
		})
		if (!post) return error('Публикация не найдена', 404)

		await prisma.post.delete({ where: { id } })
		return success({ ok: true })
	} catch (err) {
		return serverError(err)
	}
}

export async function GET(_request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT', 'ACCOUNTANT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const { id } = await context.params

	try {
		const post = await prisma.post.findUnique({
			where: { id },
			select: postListSelect,
		})
		if (!post) return error('Публикация не найдена', 404)

		const liked = await prisma.postLike.findUnique({
			where: {
				postId_userId: { postId: id, userId: session.user.id },
			},
			select: { id: true },
		})

		return success(
			toPostDto(post, session.user.id, new Set(liked ? [id] : [])),
		)
	} catch (err) {
		return serverError(err)
	}
}
