import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { auth } from '@/shared/lib/auth'
import { created, forbidden, unauthorized } from '@/shared/api'

export async function POST(request: Request) {
	const session = await auth()
	if (!session) return unauthorized()
	if (!['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) return forbidden()

	const formData = await request.formData()
	const file = formData.get('file')

	if (!file || !(file instanceof File)) {
		return Response.json({ error: 'Файл не найден' }, { status: 400 })
	}

	const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
	await mkdir(uploadsDir, { recursive: true })

	const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
	const buffer = Buffer.from(await file.arrayBuffer())
	await writeFile(path.join(uploadsDir, filename), buffer)

	return created({ url: `/uploads/${filename}` })
}
