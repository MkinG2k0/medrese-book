import type { Prisma } from '@/shared/lib/prisma'

export class ReversalError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ReversalError'
	}
}

type ReversibleRecord = {
	id: string
	amount: number
	reversalOfId: string | null
	reversals?: { id: string }[]
}

export function validateReversalTarget(
	record: ReversibleRecord | null,
	entityLabel: string,
): asserts record is ReversibleRecord {
	if (!record) throw new ReversalError(`${entityLabel} не найдена`)
	if (record.reversalOfId) {
		throw new ReversalError('Нельзя сторнировать сторнирующую запись')
	}
	if (record.amount <= 0) {
		throw new ReversalError('Нельзя сторнировать отрицательную запись')
	}
	if (record.reversals && record.reversals.length > 0) {
		throw new ReversalError('Запись уже сторнирована')
	}
}

export function reversalAmount(originalAmount: number): number {
	return -originalAmount
}

export type FinancialMutationClient = Prisma.TransactionClient
