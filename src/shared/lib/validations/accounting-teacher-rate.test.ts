import { describe, expect, it } from 'vitest'

import { getLocalDateString } from '@/shared/lib/calendar-date'
import { setTeacherRateSchema } from '@/shared/lib/validations/accounting'

describe('setTeacherRateSchema', () => {
	it('принимает ставку с сегодняшней датой', () => {
		const parsed = setTeacherRateSchema.safeParse({
			teacherId: 't1',
			hourlyRateKopecks: 187_500,
			validFrom: getLocalDateString(),
		})
		expect(parsed.success).toBe(true)
	})

	it('отклоняет ставку задним числом', () => {
		const parsed = setTeacherRateSchema.safeParse({
			teacherId: 't1',
			hourlyRateKopecks: 187_500,
			validFrom: '2020-01-01',
		})
		expect(parsed.success).toBe(false)
		if (!parsed.success) {
			expect(parsed.error.issues[0]?.message).toBe(
				'Нельзя поставить ставку задним числом',
			)
		}
	})
})
