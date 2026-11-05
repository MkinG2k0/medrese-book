import { prisma } from '@/shared/lib/prisma'

import {
	mapTuitionDebtRows,
	type TuitionDebtRow,
} from './map-tuition-debt-rows'

export type { TuitionDebtRow, TuitionDebtSourceStudent } from './map-tuition-debt-rows'
export { mapTuitionDebtRows } from './map-tuition-debt-rows'

export async function queryTuitionDebts(): Promise<TuitionDebtRow[]> {
	const students = await prisma.student.findMany({
		where: { status: 'ACTIVE' },
		include: {
			user: { select: { name: true } },
			parent: { select: { name: true } },
			tuitionCharges: { select: { month: true, amount: true } },
			tuitionPayments: { select: { month: true, amount: true } },
		},
		orderBy: { user: { name: 'asc' } },
	})

	return mapTuitionDebtRows(
		students.map((student) => {
			const guardian = student.guardianName?.trim()
			return {
				studentId: student.id,
				studentName: student.fullName ?? student.user.name,
				parentName: student.parent?.name ?? (guardian || null),
				tuitionRateKopecks: student.tuitionRate,
				charges: student.tuitionCharges,
				payments: student.tuitionPayments,
			}
		}),
	)
}
