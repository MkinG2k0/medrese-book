export const isRealLessonSession = (s: { isAdjustment: boolean }) =>
	!s.isAdjustment

export const isCountableCompletion = (c: { isPriorCredit: boolean }) =>
	!c.isPriorCredit
