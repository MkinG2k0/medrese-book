import { describe, expect, it } from 'vitest'

import { buildDraftSessionCompletions } from '@/features/journal/lib/build-draft-session-completions'

describe('buildDraftSessionCompletions', () => {
	const steps = [{ id: 'step-1' }, { id: 'step-2' }, { id: 'step-3' }]

	it('returns empty list when attendance is ABSENT', () => {
		expect(
			buildDraftSessionCompletions('ABSENT', steps, {
				'step-1': { grade: 5, note: 'ok' },
			}),
		).toEqual([])
	})

	it('includes only steps with a grade from the draft', () => {
		expect(
			buildDraftSessionCompletions('PRESENT', steps, {
				'step-1': { grade: 5, note: 'отлично' },
				'step-2': { grade: null, note: '' },
				'step-3': { grade: 3, note: '' },
			}),
		).toEqual([
			{ stepId: 'step-1', grade: 5, note: 'отлично' },
			{ stepId: 'step-3', grade: 3, note: null },
		])
	})

	it('skips steps missing from draft state', () => {
		expect(
			buildDraftSessionCompletions('LATE', steps, {
				'step-2': { grade: 4, note: '  ' },
			}),
		).toEqual([{ stepId: 'step-2', grade: 4, note: null }])
	})
})
