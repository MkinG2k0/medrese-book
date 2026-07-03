import type { SchoolBalanceSummary } from '@/features/accounting/lib/compute-school-balance'

export type { SchoolBalanceSummary }

export type StudentPaymentRow = {
	studentId: string
	studentName: string
	groupName: string
	tuitionRateKopecks: number
	discountReason: string | null
	monthPaidKopecks: number
	monthChargeKopecks: number
	balanceKopecks: number
	status:
		| { kind: 'paid' }
		| { kind: 'partial'; debtKopecks: number }
		| { kind: 'debt'; debtMonths: number; debtKopecks: number }
		| { kind: 'advance'; advanceKopecks: number }
}

export type SalaryRow = {
	accrualId: string
	teacherId: string
	teacherName: string
	totalMinutes: number
	hoursLabel: string
	anomalyCount: number
	hourlyRateKopecks: number | null
	amountKopecks: number
	status: 'DRAFT' | 'CONFIRMED' | 'PAID'
}

export type TeacherLessonRow = {
	sessionId: string
	date: string
	startedAt: string
	endedAt: string | null
	durationMinutes: number | null
	isAnomaly: boolean
	isAdjusted: boolean
	groupName: string
}

export type LedgerEntry = {
	id: string
	type: string
	date: string
	amountKopecks: number
	method: string | null
	label: string
	comment: string | null
	createdBy: string | null
	isReversal: boolean
}

export type TeacherOwnSalary = {
	month: string
	totalMinutes: number
	amountKopecks: number
	status: 'DRAFT' | 'CONFIRMED' | 'PAID'
	paidKopecks: number
}
