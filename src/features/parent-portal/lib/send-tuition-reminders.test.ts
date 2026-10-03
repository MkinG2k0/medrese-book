import { beforeEach, describe, expect, it, vi } from 'vitest'

const studentFindManyMock = vi.fn()
const notificationFindManyMock = vi.fn()
const dispatchDomainEventMock = vi.fn()

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		student: {
			findMany: (...args: unknown[]) => studentFindManyMock(...args),
		},
		notification: {
			findMany: (...args: unknown[]) => notificationFindManyMock(...args),
		},
	},
}))

vi.mock('@/shared/lib/domain-events', () => ({
	dispatchDomainEvent: (...args: unknown[]) => dispatchDomainEventMock(...args),
}))

import {
	collectParentIdsWithActiveChildDebt,
	sendTuitionReminders,
} from './send-tuition-reminders'

describe('collectParentIdsWithActiveChildDebt', () => {
	it('returns unique parents with at least one indebted active child', () => {
		expect(
			collectParentIdsWithActiveChildDebt([
				{
					parentId: 'parent-1',
					tuitionCharges: [{ amount: 200_000 }],
					tuitionPayments: [{ amount: 50_000 }],
				},
				{
					parentId: 'parent-1',
					tuitionCharges: [{ amount: 200_000 }],
					tuitionPayments: [{ amount: 200_000 }],
				},
				{
					parentId: 'parent-2',
					tuitionCharges: [{ amount: 200_000 }],
					tuitionPayments: [{ amount: 200_000 }],
				},
				{
					parentId: null,
					tuitionCharges: [{ amount: 200_000 }],
					tuitionPayments: [],
				},
			]),
		).toEqual(['parent-1'])
	})
})

describe('sendTuitionReminders', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		dispatchDomainEventMock.mockResolvedValue([{ id: 'n1' }])
	})

	it('no-ops when it is not the last Moscow calendar day', async () => {
		const result = await sendTuitionReminders(new Date('2026-10-30T09:00:00.000Z'))

		expect(result).toMatchObject({
			month: '2026-10',
			lastDay: false,
			created: 0,
		})
		expect(studentFindManyMock).not.toHaveBeenCalled()
		expect(dispatchDomainEventMock).not.toHaveBeenCalled()
	})

	it('dispatches one reminder event for parents with debt', async () => {
		studentFindManyMock.mockResolvedValue([
			{
				parentId: 'parent-1',
				tuitionCharges: [{ amount: 200_000 }],
				tuitionPayments: [],
			},
		])
		notificationFindManyMock.mockResolvedValue([])

		const result = await sendTuitionReminders(new Date('2026-10-31T09:00:00.000Z'))

		expect(result.created).toBe(1)
		expect(result.eligibleParentIds).toEqual(['parent-1'])
		expect(dispatchDomainEventMock).toHaveBeenCalledWith(
			{
				actorId: 'system',
				action: 'TUITION_PAYMENT_REMINDER',
				entityType: 'TuitionPaymentReminder',
				entityId: '2026-10',
				payload: {
					month: '2026-10',
					monthLabel: 'октябрь',
					parentIds: ['parent-1'],
				},
			},
			undefined,
		)
	})

	it('skips parents already reminded for the same month', async () => {
		studentFindManyMock.mockResolvedValue([
			{
				parentId: 'parent-1',
				tuitionCharges: [{ amount: 200_000 }],
				tuitionPayments: [],
			},
		])
		notificationFindManyMock.mockResolvedValue([
			{ userId: 'parent-1', payload: { month: '2026-10' } },
		])

		const result = await sendTuitionReminders(new Date('2026-10-31T09:00:00.000Z'))

		expect(result.created).toBe(0)
		expect(result.skippedExisting).toBe(1)
		expect(dispatchDomainEventMock).not.toHaveBeenCalled()
	})
})
