'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import type { StudentStatus } from '@/shared/lib/student-status'

export type ParentChildSummary = {
	studentId: string
	name: string
	status: StudentStatus
	groups: string[]
}

export type ParentChildrenDashboard = {
	parentName: string
	children: ParentChildSummary[]
}

export async function getParentChildrenDashboard(): Promise<ParentChildrenDashboard | null> {
	const session = await requireRole('PARENT')

	const parent = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			name: true,
			children: {
				select: {
					id: true,
					status: true,
					fullName: true,
					user: { select: { name: true } },
					enrollments: {
						select: { group: { select: { name: true } } },
						orderBy: { enrolledAt: 'asc' },
					},
				},
				orderBy: { user: { name: 'asc' } },
			},
		},
	})

	if (!parent) return null

	return {
		parentName: parent.name,
		children: parent.children.map((child) => ({
			studentId: child.id,
			name: child.fullName?.trim() || child.user.name,
			status: child.status,
			groups: child.enrollments.map((enrollment) => enrollment.group.name),
		})),
	}
}
