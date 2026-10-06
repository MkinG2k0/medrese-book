import { error, forbidden, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { postListSelect, toPostDto } from '@/shared/lib/posts/post-dto'
import { assertPostVisibleToRole } from '@/shared/lib/posts/post-visibility'
import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import { updatePostSchema } from '@/shared/lib/validations/post'

type RouteContext = { params: Promise<{ id: string }> }

const MUTATE_ROLES = ['TEACHER', 'MANAGER', 'SUPER_ADMIN'] as const

async function loadPostForMutation(
	id: string,
	session: { user: { id: string; role: string } },
) {
	const existing = await prisma.post.findUnique({
		where: { id },
		select: { id: true, authorId: true },
	})
	if (!existing) return { errorResponse: error('Публикация не найдена', 404) }
	if (session.user.role === 'TEACHER' && existing.authorId !== session.user.id) {
		return { errorResponse: forbidden() }
	}
	return { existing }
}

export async function PATCH(request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: [...MUTATE_ROLES],
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
		const loaded = await loadPostForMutation(id, session)
		if ('errorResponse' in loaded) return loaded.errorResponse

		if (session.user.role === 'TEACHER' && parsed.data.type === 'SYSTEM') {
			return error('Учитель может создавать только обычные публикации')
		}

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
		allowedRoles: [...MUTATE_ROLES],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const { id } = await context.params

	try {
		const loaded = await loadPostForMutation(id, session)
		if ('errorResponse' in loaded) return loaded.errorResponse

		await prisma.post.delete({ where: { id } })
		return success({ ok: true })
	} catch (err) {
		return serverError(err)
	}
}

export async function GET(_request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT', 'ACCOUNTANT', 'PARENT'],
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
