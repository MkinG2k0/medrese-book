import { prisma } from '@/shared/lib/prisma'

export type LedgerEntry = {
	id: string
	type:
		| 'payment'
		| 'expense'
		| 'donation'
		| 'salary_payout'
		| 'charge'
		| 'salary_accrual'
	date: string
	amountKopecks: number
	method: string | null
	label: string
	comment: string | null
	createdBy: string | null
	isReversal: boolean
}

export async function queryOperationsLedger(filters: {
	from?: Date
	to?: Date
	type?: LedgerEntry['type']
}): Promise<LedgerEntry[]> {
	const dateFilter =
		filters.from || filters.to
			? {
					...(filters.from ? { gte: filters.from } : {}),
					...(filters.to ? { lte: filters.to } : {}),
				}
			: undefined

	const [payments, expenses, donations, payouts, charges, accruals] =
		await Promise.all([
			prisma.tuitionPayment.findMany({
				where: dateFilter ? { date: dateFilter } : undefined,
				include: {
					student: { include: { user: { select: { name: true } } } },
					createdBy: { select: { name: true } },
				},
				orderBy: { date: 'desc' },
			}),
			prisma.expense.findMany({
				where: dateFilter ? { date: dateFilter } : undefined,
				include: { createdBy: { select: { name: true } } },
				orderBy: { date: 'desc' },
			}),
			prisma.donation.findMany({
				where: dateFilter ? { date: dateFilter } : undefined,
				include: { createdBy: { select: { name: true } } },
				orderBy: { date: 'desc' },
			}),
			prisma.salaryPayout.findMany({
				where: dateFilter ? { date: dateFilter } : undefined,
				include: {
					createdBy: { select: { name: true } },
					accrual: { include: { teacher: { include: { user: true } } } },
				},
				orderBy: { date: 'desc' },
			}),
			prisma.tuitionCharge.findMany({
				where: filters.from || filters.to
					? {
							month: {
								gte: filters.from?.toISOString().slice(0, 7),
								lte: filters.to?.toISOString().slice(0, 7),
							},
						}
					: undefined,
				include: {
					student: { include: { user: { select: { name: true } } } },
				},
				orderBy: { createdAt: 'desc' },
			}),
			prisma.salaryAccrual.findMany({
				where: filters.from || filters.to
					? {
							month: {
								gte: filters.from?.toISOString().slice(0, 7),
								lte: filters.to?.toISOString().slice(0, 7),
							},
						}
					: undefined,
				include: { teacher: { include: { user: { select: { name: true } } } } },
				orderBy: { createdAt: 'desc' },
			}),
		])

	const entries: LedgerEntry[] = [
		...payments.map((row) => ({
			id: row.id,
			type: 'payment' as const,
			date: row.date.toISOString(),
			amountKopecks: row.amount,
			method: row.method,
			label: `Платёж: ${row.student.fullName ?? row.student.user.name}`,
			comment: row.comment,
			createdBy: row.createdBy.name,
			isReversal: row.reversalOfId != null || row.amount < 0,
		})),
		...expenses.map((row) => ({
			id: row.id,
			type: 'expense' as const,
			date: row.date.toISOString(),
			amountKopecks: row.amount,
			method: row.method,
			label: `Расход: ${row.category}`,
			comment: row.comment,
			createdBy: row.createdBy.name,
			isReversal: row.reversalOfId != null || row.amount < 0,
		})),
		...donations.map((row) => ({
			id: row.id,
			type: 'donation' as const,
			date: row.date.toISOString(),
			amountKopecks: row.amount,
			method: row.method,
			label: 'Пожертвование',
			comment: row.comment,
			createdBy: row.createdBy.name,
			isReversal: row.reversalOfId != null || row.amount < 0,
		})),
		...payouts.map((row) => ({
			id: row.id,
			type: 'salary_payout' as const,
			date: row.date.toISOString(),
			amountKopecks: row.amount,
			method: row.method,
			label: `Зарплата: ${row.accrual.teacher.user.name}`,
			comment: row.comment,
			createdBy: row.createdBy.name,
			isReversal: row.reversalOfId != null || row.amount < 0,
		})),
		...charges.map((row) => ({
			id: row.id,
			type: 'charge' as const,
			date: row.createdAt.toISOString(),
			amountKopecks: -row.amount,
			method: null,
			label: `Начисление: ${row.student.fullName ?? row.student.user.name}`,
			comment: row.month,
			createdBy: null,
			isReversal: false,
		})),
		...accruals.map((row) => ({
			id: row.id,
			type: 'salary_accrual' as const,
			date: row.createdAt.toISOString(),
			amountKopecks: -row.amount,
			method: null,
			label: `Начисление ЗП: ${row.teacher.user.name}`,
			comment: row.month,
			createdBy: null,
			isReversal: false,
		})),
	]

	const filtered = filters.type
		? entries.filter((entry) => entry.type === filters.type)
		: entries

	return filtered.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	)
}
