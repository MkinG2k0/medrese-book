import { describe, expect, it } from 'vitest'

import { AT_RISK_CONFIG } from './at-risk-config'
import { evaluateAttendanceRisk } from './attendance-risk'
import { buildStudentRiskFlags } from './risk-flags'
import { evaluateTimeNormForLevel } from './time-norm'

describe('evaluateTimeNormForLevel', () => {
	it('marks violation when actual minutes exceed budget on level', () => {
		const result = evaluateTimeNormForLevel({
			levelId: 'level-1',
			actualMinutes: 300,
			completedStepsOnLevel: [{ hours: 4 }],
		})

		expect(result).toEqual({
			levelId: 'level-1',
			actualMinutes: 300,
			budgetMinutes: 240,
			isViolated: true,
		})
	})

	it('does not violate when actual minutes are within budget', () => {
		const result = evaluateTimeNormForLevel({
			levelId: 'level-1',
			actualMinutes: 100,
			completedStepsOnLevel: [{ hours: 4 }],
		})

		expect(result.isViolated).toBe(false)
	})

	it('excludes prior credit steps from budget', () => {
		const result = evaluateTimeNormForLevel({
			levelId: 'level-1',
			actualMinutes: 150,
			completedStepsOnLevel: [
				{ hours: 2, isPriorCredit: true },
				{ hours: 2, isPriorCredit: false },
			],
		})

		expect(result.budgetMinutes).toBe(120)
		expect(result.isViolated).toBe(true)
	})
})

describe('buildStudentRiskFlags', () => {
	it('includes TIME_NORM when norm is violated', () => {
		const flags = buildStudentRiskFlags({
			studentId: 'student-1',
			timeNorm: {
				levelId: 'level-1',
				actualMinutes: 150,
				budgetMinutes: 120,
				isViolated: true,
			},
			attendanceRisk: false,
		})

		expect(flags).toContain('TIME_NORM')
	})

	it('includes ATTENDANCE when attendance risk is true', () => {
		const flags = buildStudentRiskFlags({
			studentId: 'student-1',
			timeNorm: {
				levelId: 'level-1',
				actualMinutes: 100,
				budgetMinutes: 120,
				isViolated: false,
			},
			attendanceRisk: true,
		})

		expect(flags).toContain('ATTENDANCE')
	})

	it('returns empty array when no risks are triggered', () => {
		const flags = buildStudentRiskFlags({
			studentId: 'student-1',
			timeNorm: {
				levelId: 'level-1',
				actualMinutes: 100,
				budgetMinutes: 120,
				isViolated: false,
			},
			attendanceRisk: false,
		})

		expect(flags).toEqual([])
	})

	it('respects enabledSignals config', () => {
		const flags = buildStudentRiskFlags({
			studentId: 'student-1',
			timeNorm: {
				levelId: 'level-1',
				actualMinutes: 150,
				budgetMinutes: 120,
				isViolated: true,
			},
			attendanceRisk: true,
			config: { enabledSignals: ['ATTENDANCE'] },
		})

		expect(flags).toEqual(['ATTENDANCE'])
	})
})

describe('risk flag integration', () => {
	const monthRange = {
		gte: new Date('2026-01-01T00:00:00.000Z'),
		lte: new Date('2026-01-31T23:59:59.999Z'),
	}

	it('flags attendance after 3 absences in month', () => {
		const attendanceRisk = evaluateAttendanceRisk({
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

		expect(
			buildStudentRiskFlags({
				studentId: 'student-1',
				attendanceRisk,
			}),
		).toEqual(['ATTENDANCE'])
	})
})
