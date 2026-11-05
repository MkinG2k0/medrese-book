'use server'

import { mapParentPaymentChild } from '@/features/parent-portal/lib/map-parent-payment-child'
import { moscowMonthKey } from '@/shared/lib/moscow-date'
import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'

export type ParentPaymentChild = {
	studentId: string
	name: string
	tuitionRateKopecks: number
	groupNames: string[]
	earliestMonth: string
	chargesByMonth: Record<string, number>
	paidByMonth: Record<string, number>
}

export type ParentPaymentRequestSummary = {
	id: string
	status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
	createdAt: string
	rejectReason: string | null
	totalKopecks: number
	lines: Array<{
		studentId: string
		studentName: string
		amountKopecks: number
	}>
}

export type ParentPaymentPageData = {
	parentUserId: string
	children: ParentPaymentChild[]
	requests: ParentPaymentRequestSummary[]
}

export async function getParentPaymentPageData(): Promise<ParentPaymentPageData> {
	const session = await requireRole('PARENT')
	const currentMonth = moscowMonthKey()

	const [children, requests] = await Promise.all([
		prisma.student.findMany({
			where: {
				parentId: session.user.id,
				status: 'ACTIVE',
			},
			select: {
				id: true,
				fullName: true,
				tuitionRate: true,
				user: { select: { name: true, createdAt: true } },
				enrollments: {
					select: {
						enrolledAt: true,
						group: { select: { name: true } },
					},
					orderBy: { enrolledAt: 'asc' },
				},
				tuitionCharges: { select: { month: true, amount: true } },
				tuitionPayments: { select: { month: true, amount: true } },
			},
			orderBy: { user: { name: 'asc' } },
		}),
		prisma.tuitionPaymentRequest.findMany({
			where: { parentId: session.user.id },
			include: {
				lines: {
					include: {
						student: {
							select: {
								id: true,
								fullName: true,
								user: { select: { name: true } },
							},
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: 20,
		}),
	])

	return {
		parentUserId: session.user.id,
		children: children.map((child) =>
			mapParentPaymentChild(child, currentMonth),
		),
		requests: requests.map((request) => ({
			id: request.id,
			status: request.status,
			createdAt: request.createdAt.toISOString(),
			rejectReason: request.rejectReason,
			totalKopecks: request.lines.reduce((sum, line) => sum + line.amount, 0),
			lines: request.lines.map((line) => ({
				studentId: line.studentId,
				studentName: line.student.fullName?.trim() || line.student.user.name,
				amountKopecks: line.amount,
			})),
		})),
	}
}
