import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { uploadFile } from '@/shared/lib/storage/upload-file'
import { created, error } from '@/shared/api'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const CHAT_IMAGE_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
])

function isAllowedMime(role: string, contentType: string): boolean {
	if (CHAT_IMAGE_TYPES.has(contentType)) return true

	if (
		(role === 'MANAGER' || role === 'SUPER_ADMIN') &&
		contentType.startsWith('video/')
	) {
		return true
	}

	return false
}

export async function POST(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const formData = await request.formData()
	const file = formData.get('file')

	if (!file || !(file instanceof File)) {
		return error('Файл не найден')
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		return error('Размер файла не должен превышать 10 МБ')
	}

	const contentType = file.type || 'application/octet-stream'
	if (!isAllowedMime(session.user.role, contentType)) {
		return error(
			session.user.role === 'MANAGER' || session.user.role === 'SUPER_ADMIN'
				? 'Допустимы изображения jpeg/png/webp или видео'
				: 'Допустимы только изображения jpeg, png или webp',
		)
	}

	const buffer = Buffer.from(await file.arrayBuffer())
	const result = await uploadFile({
		filename: file.name,
		buffer,
		contentType,
	})

	return created({ url: result.url })
}
