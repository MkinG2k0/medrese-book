'use server'

import { endOfDay, startOfDay } from 'date-fns'
import { revalidatePath } from 'next/cache'

import { serializeLeaveRequest } from '@/features/leave-requests/model/types'
import {
	queryLeaveRequests,
	type LeaveRequestListFilters,
} from '@/features/leave-requests/lib/query-leave-requests'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import { requireRole, requireRoles } from '@/shared/lib/session'
import {
	approveLeaveRequestSchema,
	createLeaveRequestSchema,
	rejectLeaveRequestSchema,
} from '@/shared/lib/validations/leave-request'

function normalizeLeaveDates(startDate: string, endDate: string) {
	return {
		startDate: startOfDay(new Date(startDate)),
		endDate: endOfDay(new Date(endDate)),
	}
}

function buildLeaveEventPayload(request: {
	id: string
	teacherId: string
	type: string
	startDate: Date
	endDate: Date
	substituteTeacherId?: string | null
}, teacherUserId: string) {
	return {
		leaveRequestId: request.id,
		teacherUserId,
		teacherId: request.teacherId,
		type: request.type,
		startDate: request.startDate.toISOString(),
		endDate: request.endDate.toISOString(),
		substituteTeacherId: request.substituteTeacherId ?? null,
	}
}

export async function createLeaveRequest(input: unknown) {
	const session = await requireRole('TEACHER')
	const teacherId = session.user.teacherId
	if (!teacherId) {
		throw new Error('Профиль преподавателя не найден')
	}

	const data = createLeaveRequestSchema.parse(input)
	const { startDate, endDate } = normalizeLeaveDates(data.startDate, data.endDate)

	const leaveRequest = await prisma.$transaction(async (tx) => {
		const created = await tx.leaveRequest.create({
			data: {
				teacherId,
				type: data.type,
				status: 'CREATED',
				startDate,
				endDate,
				description: data.description,
			},
			include: { teacher: { include: { user: true } } },
		})

		await dispatchDomainEvent(
			{
				actorId: session.user.id,
				action: 'LEAVE_REQUEST_CREATED',
				entityType: 'LeaveRequest',
				entityId: created.id,
				payload: buildLeaveEventPayload(created, created.teacher.userId),
			},
			tx,
		)

		return created
	})

	revalidatePath('/calendar')
	revalidatePath('/admin/leave-calendar')

	return serializeLeaveRequest(leaveRequest)
}

export async function approveLeaveRequest(input: unknown) {
	const session = await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = approveLeaveRequestSchema.parse(input)

	const leaveRequest = await prisma.leaveRequest.findUnique({
		where: { id: data.leaveRequestId },
		include: { teacher: { include: { user: true } } },
	})

	if (!leaveRequest) {
		throw new Error('Заявка не найдена')
	}

	if (leaveRequest.status !== 'CREATED') {
		throw new Error('Заявку можно подтвердить только в статусе «Создана»')
	}

	if (data.substituteTeacherId === leaveRequest.teacherId) {
		throw new Error('Замещающий не может совпадать с заявителем')
	}

	const substitute = await prisma.teacher.findUnique({
		where: { id: data.substituteTeacherId },
		include: { user: true },
	})

	if (!substitute || substitute.user.role !== 'TEACHER') {
		throw new Error('Выберите действующего преподавателя в качестве замещающего')
	}

	const updated = await prisma.$transaction(async (tx) => {
		const substitution = await tx.substitution.create({
			data: {
				absentTeacherId: leaveRequest.teacherId,
				substituteTeacherId: data.substituteTeacherId,
				leaveRequestId: leaveRequest.id,
				startDate: leaveRequest.startDate,
				endDate: leaveRequest.endDate,
				isActive: true,
			},
		})

		const approved = await tx.leaveRequest.update({
			where: { id: leaveRequest.id },
			data: {
				status: 'APPROVED',
				substituteTeacherId: data.substituteTeacherId,
				substitutionId: substitution.id,
			},
			include: { teacher: { include: { user: true } } },
		})

		const eventPayload = buildLeaveEventPayload(
			{
				...approved,
				substituteTeacherId: data.substituteTeacherId,
			},
			leaveRequest.teacher.userId,
		)

		await dispatchDomainEvent(
			{
				actorId: session.user.id,
				action: 'LEAVE_REQUEST_APPROVED',
				entityType: 'LeaveRequest',
				entityId: approved.id,
				payload: eventPayload,
			},
			tx,
		)

		await dispatchDomainEvent(
			{
				actorId: session.user.id,
				action: 'SUBSTITUTION_ACTIVATED',
				entityType: 'Substitution',
				entityId: substitution.id,
				payload: eventPayload,
			},
			tx,
		)

		return approved
	})

	revalidatePath('/calendar')
	revalidatePath('/admin/leave-calendar')

	return serializeLeaveRequest(updated)
}

export async function rejectLeaveRequest(input: unknown) {
	const session = await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = rejectLeaveRequestSchema.parse(input)

	const leaveRequest = await prisma.leaveRequest.findUnique({
		where: { id: data.leaveRequestId },
		include: { teacher: { include: { user: true } } },
	})

	if (!leaveRequest) {
		throw new Error('Заявка не найдена')
	}

	if (leaveRequest.status !== 'CREATED') {
		throw new Error('Заявку можно отклонить только в статусе «Создана»')
	}

	const updated = await prisma.$transaction(async (tx) => {
		const rejected = await tx.leaveRequest.update({
			where: { id: leaveRequest.id },
			data: {
				status: 'REJECTED',
				rejectionReason: data.rejectionReason,
			},
		})

		await dispatchDomainEvent(
			{
				actorId: session.user.id,
				action: 'LEAVE_REQUEST_REJECTED',
				entityType: 'LeaveRequest',
				entityId: rejected.id,
				payload: {
					...buildLeaveEventPayload(leaveRequest, leaveRequest.teacher.userId),
					rejectionReason: data.rejectionReason,
				},
			},
			tx,
		)

		return rejected
	})

	revalidatePath('/calendar')
	revalidatePath('/admin/leave-calendar')

	return serializeLeaveRequest(updated)
}

export async function listLeaveRequests(filters: LeaveRequestListFilters = {}) {
	const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const scopeTeacherId =
		session.user.role === 'TEACHER' ? session.user.teacherId : null

	if (session.user.role === 'TEACHER') {
		if (!scopeTeacherId) {
			throw new Error('Профиль преподавателя не найден')
		}
		if (filters.teacherId && filters.teacherId !== scopeTeacherId) {
			throw new Error('Недостаточно прав для просмотра чужих заявок')
		}
	}

	return queryLeaveRequests(scopeTeacherId, filters)
}
