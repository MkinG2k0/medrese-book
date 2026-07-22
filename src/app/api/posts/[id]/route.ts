import { error, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { postListSelect, toPostDto } from '@/shared/lib/posts/post-dto'
import { assertPostVisibleToRole } from '@/shared/lib/posts/post-visibility'
import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import { updatePostSchema } from '@/shared/lib/validations/post'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const { id } = await context.params

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return error('Некорректный JSON')
	}

	const parsed = updatePostSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	try {
		const existing = await prisma.post.findUnique({
			where: { id },
			select: { id: true },
		})
		if (!existing) return error('Публикация не найдена', 404)

		const post = await prisma.$transaction(async (tx) => {
			await tx.postMedia.deleteMany({ where: { postId: id } })

			await tx.post.update({
				where: { id },
				data: {
					title: parsed.data.title,
					body: parsed.data.body as Prisma.InputJsonValue,
					type: parsed.data.type,
					media: {
						create: parsed.data.media.map((item, index) => ({
							type: item.type,
							url: item.url,
							sortOrder: item.sortOrder ?? index,
						})),
					},
				},
			})

			return tx.post.findUniqueOrThrow({
				where: { id },
				select: postListSelect,
			})
		})

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
		if (!post || !assertPostVisibleToRole(post.type, session.user.role)) {
			return error('Публикация не найдена', 404)
		}

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
