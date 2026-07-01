import { AT_RISK_CONFIG, type AtRiskConfig } from './at-risk-config'
import type { RiskFlag, TimeNormResult } from './types'

export type BuildStudentRiskFlagsContext = {
	studentId: string
	timeNorm?: TimeNormResult | null
	attendanceRisk: boolean
	config?: Pick<AtRiskConfig, 'enabledSignals'>
}

export function buildStudentRiskFlags(
	_context: BuildStudentRiskFlagsContext,
): RiskFlag[] {
	const config = _context.config ?? AT_RISK_CONFIG
	const flags: RiskFlag[] = []

	if (
		config.enabledSignals.includes('TIME_NORM') &&
		_context.timeNorm?.isViolated
	) {
		flags.push('TIME_NORM')
	}

	if (
		config.enabledSignals.includes('ATTENDANCE') &&
		_context.attendanceRisk
	) {
		flags.push('ATTENDANCE')
	}

	return flags
}
