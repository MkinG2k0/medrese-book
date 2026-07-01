export const AT_RISK_CONFIG = {
	enabledSignals: ['TIME_NORM', 'ATTENDANCE'] as const,
	attendanceMonthThreshold: 3,
	attendanceConsecutiveThreshold: 3,
	actualTimeSource: 'proxy' as 'proxy' | 'teaching_session',
	accumulationMode: 'per_level' as const,
} as const

export type AtRiskConfig = typeof AT_RISK_CONFIG
