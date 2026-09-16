import { prisma } from '@/shared/lib/prisma'
import { getPaymentMethodLabel } from './accounting-labels'

export type StudentPaymentHistoryItem = {
	id: string
	date: string
	amountKopecks: number
	method: string
	methodLabel: string
	comment: string | null
	createdByName: string
	isReversal: boolean
	canReverse: boolean
}

export async function queryStudentPaymentHistory(
	studentId: string,
): Promise<{
	studentId: string
	studentName: string
	items: StudentPaymentHistoryItem[]
}> {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			id: true,
			fullName: true,
			user: { select: { name: true } },
		},
	})
	if (!student) {
		throw new Error('Ученик не найден')
	}

	const payments = await prisma.tuitionPayment.findMany({
		where: { studentId },
		orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
		include: {
			createdBy: { select: { name: true } },
			reversals: { select: { id: true } },
		},
	})

	return {
		studentId: student.id,
		studentName: student.fullName ?? student.user.name,
		items: payments.map((payment) => ({
			id: payment.id,
			date: payment.date.toISOString(),
			amountKopecks: payment.amount,
			method: payment.method,
			methodLabel: getPaymentMethodLabel(payment.method),
			comment: payment.comment,
			createdByName: payment.createdBy.name,
			isReversal: payment.reversalOfId != null || payment.amount < 0,
			canReverse:
				payment.amount > 0 &&
				payment.reversalOfId == null &&
				payment.reversals.length === 0,
		})),
	}
}
