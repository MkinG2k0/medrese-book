import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import { currentMonthKey } from '@/shared/lib/accounting/month'

export type GenerateChargesResult = {
	month: string
	created: number
	skipped: number
}

export async function generateMonthlyCharges(
	month: string = currentMonthKey(),
	tx?: Prisma.TransactionClient,
): Promise<GenerateChargesResult> {
	const client = tx ?? prisma

	const students = await client.student.findMany({
		where: { status: 'ACTIVE' },
		select: { id: true, tuitionRate: true },
	})

	if (students.length === 0) {
		return { month, created: 0, skipped: 0 }
	}

	const existing = await client.tuitionCharge.findMany({
		where: { month, studentId: { in: students.map((s) => s.id) } },
		select: { studentId: true },
	})
	const existingIds = new Set(existing.map((row) => row.studentId))

	const toCreate = students.filter((s) => !existingIds.has(s.id))
	if (toCreate.length === 0) {
		return { month, created: 0, skipped: students.length }
	}

	const result = await client.tuitionCharge.createMany({
		data: toCreate.map((student) => ({
			studentId: student.id,
			month,
			amount: student.tuitionRate,
		})),
	})

	return {
		month,
		created: result.count,
		skipped: students.length - result.count,
	}
}
