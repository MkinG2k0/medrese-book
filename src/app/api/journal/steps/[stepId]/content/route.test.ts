import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authorizeApiRequestMock = vi.fn()
const stepFindUniqueMock = vi.fn()

vi.mock('@/shared/lib/authorize-api-request', () => ({
	authorizeApiRequest: (...args: unknown[]) => authorizeApiRequestMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		step: {
			findUnique: (...args: unknown[]) => stepFindUniqueMock(...args),
		},
	},
}))

describe('GET /api/journal/steps/[stepId]/content', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		authorizeApiRequestMock.mockResolvedValue({
			session: { user: { id: 'user-1', role: 'TEACHER' } },
		})
	})

	it('returns step content for a teacher', async () => {
		stepFindUniqueMock.mockResolvedValue({
			content: { blocks: [{ type: 'text', value: 'урок' }] },
			teacherNote: { blocks: [] },
			pdfUrl: 'https://cdn.example/lesson.pdf',
		})

		const { GET } = await import('./route')
		const response = await GET(new Request('http://localhost/api/journal/steps/step-1/content'), {
			params: Promise.resolve({ stepId: 'step-1' }),
		})
		const json = await response.json()

		expect(response.status).toBe(200)
		expect(json.data).toEqual({
			content: { blocks: [{ type: 'text', value: 'урок' }] },
			teacherNote: { blocks: [] },
			pdfUrl: 'https://cdn.example/lesson.pdf',
		})
		expect(stepFindUniqueMock).toHaveBeenCalledWith({
			where: { id: 'step-1' },
			select: { content: true, teacherNote: true, pdfUrl: true },
		})
	})

	it('returns 404 when step is missing', async () => {
		stepFindUniqueMock.mockResolvedValue(null)

		const { GET } = await import('./route')
		const response = await GET(new Request('http://localhost/api/journal/steps/missing/content'), {
			params: Promise.resolve({ stepId: 'missing' }),
		})

		expect(response.status).toBe(404)
	})

	it('returns auth error without querying', async () => {
		authorizeApiRequestMock.mockResolvedValue({
			error: NextResponse.json({ data: null, error: 'forbidden' }, { status: 403 }),
		})

		const { GET } = await import('./route')
		const response = await GET(new Request('http://localhost/api/journal/steps/step-1/content'), {
			params: Promise.resolve({ stepId: 'step-1' }),
		})

		expect(response.status).toBe(403)
		expect(stepFindUniqueMock).not.toHaveBeenCalled()
	})
})
