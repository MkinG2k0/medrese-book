import { error } from '@/shared/api'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(_request: Request, _context: RouteContext) {
	return error('Оценка доп. заданий отключена', 400)
}

export async function DELETE(_request: Request, _context: RouteContext) {
	return error('Оценка доп. заданий отключена', 400)
}
