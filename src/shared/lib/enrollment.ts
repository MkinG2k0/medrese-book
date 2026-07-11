import { prisma, type Prisma } from '@/shared/lib/prisma'

export const primaryEnrollmentOrderBy = { enrolledAt: 'asc' as const }

type Db = typeof prisma | Prisma.TransactionClient

const primaryEnrollmentInclude = {
	group: { include: { teacher: { include: { user: true } } } },
	level: { include: { steps: { orderBy: { order: 'asc' as const } } } },
} as const

export async function findPrimaryEnrollment(studentId: string, db: Db = prisma) {
	return db.groupEnrollment.findFirst({
		where: { studentId },
		orderBy: primaryEnrollmentOrderBy,
		include: primaryEnrollmentInclude,
	})
}

export async function findEnrollmentInGroup(
	studentId: string,
	groupId: string,
	db: Db = prisma,
) {
	return db.groupEnrollment.findUnique({
		where: { studentId_groupId: { studentId, groupId } },
		include: {
			...primaryEnrollmentInclude,
			student: { include: { user: true } },
		},
	})
}

export async function getStudentGroupTeacherIds(
	studentId: string,
): Promise<string[]> {
	const enrollments = await prisma.groupEnrollment.findMany({
		where: { studentId },
		select: { group: { select: { teacherId: true } } },
	})
	return [...new Set(enrollments.map((enrollment) => enrollment.group.teacherId))]
}
