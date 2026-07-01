export { AT_RISK_CONFIG, type AtRiskConfig } from './at-risk-config'
export {
	countStudentAbsencesInMonth,
	evaluateAttendanceRisk,
	type EvaluateAttendanceRiskInput,
} from './attendance-risk'
export {
	computeLevelProgress,
	computePeriodMetrics,
	type ComputeLevelProgressInput,
	type ComputePeriodMetricsInput,
	type LevelProgress,
} from './period-metrics'
export {
	buildStudentRiskFlags,
	type BuildStudentRiskFlagsContext,
} from './risk-flags'
export {
	evaluateTimeNormForLevel,
	type EvaluateTimeNormInput,
} from './time-norm'
export {
	loadStudentMetricsContext,
	loadStudentMetricsForMonth,
	type StudentMetricsBundle,
} from './load-student-metrics'
export type {
	AtRiskStudentRow,
	RiskFlag,
	StudentPeriodMetrics,
	TimeNormResult,
} from './types'
