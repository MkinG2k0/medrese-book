import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchJournalStepContent } from './fetch-journal-step-content'

describe('fetchJournalStepContent', () => {
	beforeEach(() => {
		vi.unstubAllGlobals()
	})

	it('returns data from the API', async () => {
		const payload = {
			data: {
				content: { blocks: [] },
				teacherNote: { blocks: [] },
				pdfUrl: '/uploads/lesson.pdf',
			},
			error: null,
		}
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => payload,
			}),
		)

		await expect(fetchJournalStepContent('step-1')).resolves.toEqual(payload.data)
		expect(fetch).toHaveBeenCalledWith('/api/journal/steps/step-1/content')
	})

	it('returns null on error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ data: null, error: 'not found' }),
			}),
		)

		await expect(fetchJournalStepContent('missing')).resolves.toBeNull()
	})
})
