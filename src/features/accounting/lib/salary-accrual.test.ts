import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		salaryAccrual: {
			findUnique: vi.fn(),
			create: vi.fn(),
			updateMany: vi.fn(),
			upsert: vi.fn(),
			update: vi.fn(),
		},
		teachingSession: { findMany: vi.fn() },
		teacherRate: { findMany: vi.fn() },
	},
}))

import { prisma } from '@/shared/lib/prisma'

import {
	confirmSalaryAccrual,
	recalculateSalaryAccrualDraft,
} from './salary-accrual'

const teacherId = 'teacher-1'
const month = '2026-11'
const accrualId = 'accrual-1'
const frozen = {
	id: accrualId,
	teacherId,
	month,
	totalMinutes: 120,
	amount: 10_000,
	status: 'CONFIRMED' as const,
}

function session(minutes: number) {
	const startedAt = new Date('2026-11-05T09:00:00.000Z')
	return {
		id: 'session-1',
		teacherId,
		date: new Date('2026-11-05T12:00:00.000Z'),
		startedAt,
		endedAt: new Date(startedAt.getTime() + minutes * 60_000),
		durationAdjustment: null,
	}
}

function stubCompute(minutes = 120) {
	vi.mocked(prisma.teachingSession.findMany).mockResolvedValue([
		session(minutes),
	] as never)
	vi.mocked(prisma.teacherRate.findMany).mockResolvedValue([
		{ hourlyRate: 50000, validFrom: new Date('2026-01-01') },
	] as never)
}

describe('IMMUT-01 recalculateSalaryAccrualDraft freeze', () => {
	beforeEach(() => {
		vi.mocked(prisma.salaryAccrual.findUnique).mockReset()
		vi.mocked(prisma.salaryAccrual.create).mockReset()
		vi.mocked(prisma.salaryAccrual.updateMany).mockReset()
		vi.mocked(prisma.salaryAccrual.upsert).mockReset()
		vi.mocked(prisma.teachingSession.findMany).mockReset()
		vi.mocked(prisma.teacherRate.findMany).mockReset()
		stubCompute()
	})

	it('returns frozen CONFIRMED row and skips upsert write', async () => {
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue(
			frozen as never,
		)
		const result = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(result).toMatchObject({
			amount: 10_000,
			totalMinutes: 120,
			status: 'CONFIRMED',
		})
		expect(prisma.salaryAccrual.upsert).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.create).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.updateMany).not.toHaveBeenCalled()
	})

	it('returns frozen PAID row and skips upsert write', async () => {
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue({
			...frozen,
			status: 'PAID',
		} as never)
		const result = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(result).toMatchObject({ amount: 10_000, status: 'PAID' })
		expect(prisma.salaryAccrual.upsert).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.create).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.updateMany).not.toHaveBeenCalled()
	})

	it('creates or updates DRAFT amounts when missing or DRAFT', async () => {
		const draftRow = {
			id: accrualId,
			teacherId,
			month,
			totalMinutes: 120,
			amount: 100_000,
			status: 'DRAFT' as const,
		}
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue(null)
		vi.mocked(prisma.salaryAccrual.create).mockResolvedValue(draftRow as never)
		const created = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(prisma.salaryAccrual.create).toHaveBeenCalled()
		expect(prisma.salaryAccrual.upsert).not.toHaveBeenCalled()
		expect(created.status).toBe('DRAFT')
		expect(created.amount).toBeGreaterThan(0)

		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue(draftRow as never)
		vi.mocked(prisma.salaryAccrual.updateMany).mockResolvedValue({ count: 1 } as never)
		const updated = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(prisma.salaryAccrual.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: accrualId, status: 'DRAFT' },
				data: expect.objectContaining({
					totalMinutes: expect.any(Number),
					amount: expect.any(Number),
				}),
			}),
		)
		expect(updated.status).toBe('DRAFT')
		expect(updated.amount).toBeGreaterThan(0)
	})

	it('keeps CONFIRMED amount frozen after rate/session inputs change', async () => {
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue(
			frozen as never,
		)
		stubCompute(120)
		const first = await recalculateSalaryAccrualDraft(teacherId, month)
		stubCompute(400)
		vi.mocked(prisma.teacherRate.findMany).mockResolvedValue([
			{ hourlyRate: 99_000, validFrom: new Date('2026-01-01') },
		] as never)
		const second = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(second.amount).toBe(first.amount)
		expect(second.amount).toBe(10_000)
		expect(prisma.salaryAccrual.create).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.updateMany).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.upsert).not.toHaveBeenCalled()
		expect(prisma.salaryAccrual.update).not.toHaveBeenCalled()
	})

	it('updates DRAFT amount when session/rate inputs change', async () => {
		const draft = {
			id: accrualId,
			teacherId,
			month,
			totalMinutes: 60,
			amount: 50_000,
			status: 'DRAFT' as const,
		}
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue(draft as never)
		vi.mocked(prisma.salaryAccrual.updateMany).mockResolvedValue({ count: 1 } as never)
		stubCompute(60)
		const before = await recalculateSalaryAccrualDraft(teacherId, month)
		stubCompute(120)
		const after = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(prisma.salaryAccrual.updateMany).toHaveBeenCalled()
		expect(after.amount).toBeGreaterThan(before.amount)
		expect(after.status).toBe('DRAFT')
	})

	it('excludes unresolved anomaly minutes from DRAFT totals but still blocks confirm', async () => {
		const draft = {
			id: accrualId,
			teacherId,
			month,
			totalMinutes: 0,
			amount: 0,
			status: 'DRAFT' as const,
		}
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue(draft as never)
		vi.mocked(prisma.salaryAccrual.updateMany).mockResolvedValue({ count: 1 } as never)
		stubCompute(2881)
		const recalculated = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(recalculated.totalMinutes).toBe(0)
		expect(recalculated.amount).toBe(0)

		await expect(confirmSalaryAccrual(accrualId)).rejects.toThrow(
			/аномальной длительностью/,
		)
		expect(prisma.salaryAccrual.update).not.toHaveBeenCalled()
	})
})

describe('IMMUT-02 confirmSalaryAccrual snapshot', () => {
	beforeEach(() => {
		vi.mocked(prisma.salaryAccrual.findUnique).mockReset()
		vi.mocked(prisma.salaryAccrual.update).mockReset()
		vi.mocked(prisma.salaryAccrual.upsert).mockReset()
		vi.mocked(prisma.teachingSession.findMany).mockReset()
		vi.mocked(prisma.teacherRate.findMany).mockReset()
		stubCompute(120)
	})

	it('persists CONFIRMED status with hours_x_rate configSnapshot', async () => {
		vi.mocked(prisma.salaryAccrual.findUnique).mockResolvedValue({
			...frozen,
			status: 'DRAFT',
		} as never)
		vi.mocked(prisma.salaryAccrual.update).mockResolvedValue({
			...frozen,
			status: 'CONFIRMED',
		} as never)
		await confirmSalaryAccrual(accrualId)
		expect(prisma.salaryAccrual.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: accrualId },
				data: expect.objectContaining({
					status: 'CONFIRMED',
					configSnapshot: expect.objectContaining({
						engine: 'hours_x_rate',
						month,
						totalMinutes: expect.any(Number),
						amountKopecks: expect.any(Number),
						rates: expect.any(Array),
						computedAt: expect.any(String),
					}),
					breakdownJson: expect.anything(),
				}),
			}),
		)
	})

	it('keeps amount frozen after confirm when recalc sees new inputs', async () => {
		const confirmed = { ...frozen, status: 'CONFIRMED' as const }
		vi.mocked(prisma.salaryAccrual.findUnique)
			.mockResolvedValueOnce({ ...frozen, status: 'DRAFT' } as never)
			.mockResolvedValue(confirmed as never)
		vi.mocked(prisma.salaryAccrual.update).mockResolvedValue(
			confirmed as never,
		)
		vi.mocked(prisma.teachingSession.findMany)
			.mockResolvedValueOnce([session(120)] as never)
			.mockResolvedValue([session(300)] as never)
		await confirmSalaryAccrual(accrualId)
		const after = await recalculateSalaryAccrualDraft(teacherId, month)
		expect(after.amount).toBe(10_000)
		expect(prisma.salaryAccrual.upsert).not.toHaveBeenCalled()
	})
})
