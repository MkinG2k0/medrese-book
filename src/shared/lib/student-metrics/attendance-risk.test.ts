import { describe, expect, it } from 'vitest'

import { AT_RISK_CONFIG } from './at-risk-config'
import { evaluateAttendanceRisk } from './attendance-risk'

describe('evaluateAttendanceRisk', () => {
	const monthRange = {
		gte: new Date('2026-01-01T00:00:00.000Z'),
		lte: new Date('2026-01-31T23:59:59.999Z'),
	}

	it('returns true when absences in month reach threshold', () => {
		const result = evaluateAttendanceRisk({
			sessions: [
				{
					date: new Date('2026-01-01T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-05T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-10T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
			],
			monthRange,
			config: AT_RISK_CONFIG,
		})

		expect(result).toBe(true)
	})

	it('returns true for 3 consecutive absences even with a gap before', () => {
		const result = evaluateAttendanceRisk({
			sessions: [
				{
					date: new Date('2026-01-01T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-02T10:00:00.000Z'),
					attendance: 'PRESENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-03T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-04T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-05T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
			],
			monthRange,
			config: AT_RISK_CONFIG,
		})

		expect(result).toBe(true)
	})

	it('returns false when absences are below thresholds', () => {
		const result = evaluateAttendanceRisk({
			sessions: [
				{
					date: new Date('2026-01-01T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-03T10:00:00.000Z'),
					attendance: 'PRESENT',
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-05T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: false,
				},
			],
			monthRange,
			config: AT_RISK_CONFIG,
		})

		expect(result).toBe(false)
	})

	it('ignores adjustment sessions and non-absent attendance', () => {
		const result = evaluateAttendanceRisk({
			sessions: [
				{
					date: new Date('2026-01-01T10:00:00.000Z'),
					attendance: 'ABSENT',
					isAdjustment: true,
				},
				{
					date: new Date('2026-01-02T10:00:00.000Z'),
					attendance: 'LATE',
					isAdjustment: false,
				},
			],
			monthRange,
			config: AT_RISK_CONFIG,
		})

		expect(result).toBe(false)
	})
})
