export type RiskFlag = 'TIME_NORM' | 'ATTENDANCE'

export type StudentPeriodMetrics = {
	lessonsCount: number
	stepsCount: number
	totalMinutes: number
	monthLabel: string
}

export type TimeNormResult = {
	isViolated: boolean
	actualMinutes: number
	budgetMinutes: number
	levelId: string
}

export type AtRiskStudentRow = {
	student: { id: string; name: string }
	teacherName: string
	levelTitle: string
	riskFlags: RiskFlag[]
	absencesInMonth: number
	actualMinutes: number
	budgetMinutes: number
}
