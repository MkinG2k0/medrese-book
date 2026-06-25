import { describe, expect, it } from 'vitest'

import type { DomainEvent } from '@/shared/lib/domain-events/types'

import {
	buildNotificationsForEvent,
	formatLeaveDateFromTo,
	formatLeaveDateRange,
	getLeaveTypeLabel,
} from './build-notification'

const basePayload = {
	leaveRequestId: 'lr-1',
	teacherUserId: 'teacher-user-1',
	teacherId: 'teacher-1',
	type: 'VACATION',
	startDate: '2026-07-01T12:00:00.000Z',
	endDate: '2026-07-10T12:00:00.000Z',
}

function makeEvent(
	action: DomainEvent['action'],
	payload: Record<string, unknown> = basePayload,
): DomainEvent {
	return {
		actorId: 'actor-1',
		action,
		entityType: 'LeaveRequest',
		entityId: 'lr-1',
		payload,
	}
}

describe('build-notification helpers', () => {
	it('formats leave date range with em dash', () => {
		expect(
			formatLeaveDateRange(basePayload.startDate, basePayload.endDate),
		).toBe('01.07.2026 — 10.07.2026')
	})

	it('formats leave date range as from-to phrase', () => {
		expect(
			formatLeaveDateFromTo(basePayload.startDate, basePayload.endDate),
		).toBe('с 01.07.2026 по 10.07.2026')
	})

	it('maps leave type labels in Russian', () => {
		expect(getLeaveTypeLabel('VACATION')).toBe('Отпуск')
		expect(getLeaveTypeLabel('DAY_OFF')).toBe('Отгул')
		expect(getLeaveTypeLabel('SICK_LEAVE')).toBe('Больничный')
	})
})

describe('buildNotificationsForEvent', () => {
	it('fans out LEAVE_REQUEST_CREATED to all managers', async () => {
		const notifications = await buildNotificationsForEvent(
			makeEvent('LEAVE_REQUEST_CREATED'),
			{
				managerUserIds: ['manager-1', 'admin-1'],
				teacherName: 'Иванов И.И.',
			},
		)

		expect(notifications).toHaveLength(2)
		expect(notifications[0]).toMatchObject({
			userId: 'manager-1',
			type: 'LEAVE_REQUEST_CREATED',
			title: 'Новая заявка на отсутствие',
			body: 'Иванов И.И., Отпуск, 01.07.2026 — 10.07.2026',
			link: '/admin/leave-calendar',
		})
		expect(notifications[1]?.userId).toBe('admin-1')
	})

	it('creates LEAVE_REQUEST_APPROVED for teacher', async () => {
		const notifications = await buildNotificationsForEvent(
			makeEvent('LEAVE_REQUEST_APPROVED'),
			{
				managerUserIds: [],
				teacherUserId: 'teacher-user-1',
			},
		)

		expect(notifications).toHaveLength(1)
		expect(notifications[0]).toMatchObject({
			userId: 'teacher-user-1',
			type: 'LEAVE_REQUEST_APPROVED',
			title: 'Заявка подтверждена',
			body: 'Отпуск, 01.07.2026 — 10.07.2026',
			link: '/calendar',
		})
	})

	it('creates LEAVE_REQUEST_REJECTED with rejection reason in body', async () => {
		const notifications = await buildNotificationsForEvent(
			makeEvent('LEAVE_REQUEST_REJECTED', {
				...basePayload,
				rejectionReason: 'Нет замещающего',
			}),
			{
				managerUserIds: [],
				teacherUserId: 'teacher-user-1',
			},
		)

		expect(notifications).toHaveLength(1)
		expect(notifications[0]).toMatchObject({
			userId: 'teacher-user-1',
			type: 'LEAVE_REQUEST_REJECTED',
			title: 'Заявка отклонена',
			body: 'Причина: Нет замещающего',
			link: '/calendar',
		})
	})

	it('creates SUBSTITUTION_ACTIVATED for substitute teacher', async () => {
		const notifications = await buildNotificationsForEvent(
			makeEvent('SUBSTITUTION_ACTIVATED', {
				...basePayload,
				substituteTeacherId: 'substitute-teacher-1',
			}),
			{
				managerUserIds: [],
				substituteUserId: 'substitute-user-1',
				absentTeacherName: 'Петров П.П.',
			},
		)

		expect(notifications).toHaveLength(1)
		expect(notifications[0]).toMatchObject({
			userId: 'substitute-user-1',
			type: 'SUBSTITUTION_ACTIVATED',
			title: 'Назначено замещение',
			body: 'Вы замещаете Петров П.П. с 01.07.2026 по 10.07.2026',
			link: '/journal',
		})
	})

	it('returns empty array for unknown actions', async () => {
		const notifications = await buildNotificationsForEvent(
			makeEvent('SESSION_SAVED'),
			{ managerUserIds: [] },
		)

		expect(notifications).toEqual([])
	})
})
