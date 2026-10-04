import { describe, expect, it } from 'vitest'

import {
	pickCurrentTeacherRate,
	withCurrentRateFlag,
} from './teacher-rate-history'

describe('pickCurrentTeacherRate', () => {
	it('returns the latest rate that has already started', () => {
		const current = pickCurrentTeacherRate(
			[
				{ id: 'old', validFrom: '2026-01-01' },
				{ id: 'now', validFrom: '2026-09-01' },
				{ id: 'future', validFrom: '2026-12-01' },
			],
			'2026-10-04',
		)
		expect(current?.id).toBe('now')
	})

	it('returns null when no rate has started yet', () => {
		expect(
			pickCurrentTeacherRate([{ id: 'future', validFrom: '2026-12-01' }], '2026-10-04'),
		).toBeNull()
	})
})

describe('withCurrentRateFlag', () => {
	it('marks only the applicable rate and sorts newest first', () => {
		const flagged = withCurrentRateFlag(
			[
				{ id: 'old', validFrom: '2026-01-01' },
				{ id: 'now', validFrom: '2026-09-01' },
				{ id: 'future', validFrom: '2026-12-01' },
			],
			'2026-10-04',
		)
		expect(flagged.map((rate) => rate.id)).toEqual(['future', 'now', 'old'])
		expect(flagged.find((rate) => rate.id === 'now')?.isCurrent).toBe(true)
		expect(flagged.filter((rate) => rate.isCurrent)).toHaveLength(1)
	})
})
