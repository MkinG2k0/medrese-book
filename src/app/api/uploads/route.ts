import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { uploadFile } from '@/shared/lib/storage/upload-file'
import { created } from '@/shared/api'

export async function POST(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
	})
	if ('error' in authResult) return authResult.error

	const formData = await request.formData()
	const file = formData.get('file')

	if (!file || !(file instanceof File)) {
		return Response.json({ error: 'Файл не найден' }, { status: 400 })
	}

	const buffer = Buffer.from(await file.arrayBuffer())
	const result = await uploadFile({
		filename: file.name,
		buffer,
		contentType: file.type || undefined,
	})

	return created({ url: result.url })
}
