import { describe, expect, it } from 'vitest'

import { formatElapsedMs } from '@/features/journal/lib/format-elapsed'

describe('formatElapsedMs', () => {
	it('formats seconds and minutes', () => {
		expect(formatElapsedMs(65_000)).toBe('1:05')
	})

	it('formats hours', () => {
		expect(formatElapsedMs(3_661_000)).toBe('1:01:01')
	})

	it('never returns negative values', () => {
		expect(formatElapsedMs(-1000)).toBe('0:00')
	})
})
