import { create } from 'zustand'

import type { StepGradeState } from '@/features/journal/ui/StepCard'
import { getLocalDateString } from '@/shared/lib/calendar-date'

type SessionCompletions = Record<string, StepGradeState>

export const EMPTY_SESSION_COMPLETIONS: SessionCompletions = {}

export const selectSessionStepStates =
	(sessionKey: string) =>
	(state: JournalStore): SessionCompletions =>
		state.sessionCompletions[sessionKey] ?? EMPTY_SESSION_COMPLETIONS

export const selectExtraAssignmentGrades =
	(sessionKey: string) =>
	(state: JournalStore): SessionCompletions =>
		state.extraAssignmentGrades[sessionKey] ?? EMPTY_SESSION_COMPLETIONS

type JournalStore = {
	selectedStudentId: string | null
	setSelectedStudentId: (id: string | null) => void
	dateFilter: string
	setDateFilter: (date: string) => void
	pendingAbsentConfirm: boolean
	setPendingAbsentConfirm: (pending: boolean) => void
	sessionCompletions: Record<string, SessionCompletions>
	initSessionCompletions: (sessionKey: string, states: SessionCompletions) => void
	setSessionStepState: (
		sessionKey: string,
		stepId: string,
		state: StepGradeState,
	) => void
	clearSessionCompletions: (sessionKey: string) => void
	extraAssignmentGrades: Record<string, SessionCompletions>
	setExtraAssignmentGrade: (
		sessionKey: string,
		instanceId: string,
		state: StepGradeState,
	) => void
}

export const useJournalStore = create<JournalStore>((set) => ({
	selectedStudentId: null,
	setSelectedStudentId: (id) => set({ selectedStudentId: id }),
	dateFilter: getLocalDateString(),
	setDateFilter: (date) => set({ dateFilter: date }),
	pendingAbsentConfirm: false,
	setPendingAbsentConfirm: (pending) => set({ pendingAbsentConfirm: pending }),
	sessionCompletions: {},
	initSessionCompletions: (sessionKey, states) =>
		set((store) => ({
			sessionCompletions: {
				...store.sessionCompletions,
				[sessionKey]: states,
			},
		})),
	setSessionStepState: (sessionKey, stepId, state) =>
		set((store) => ({
			sessionCompletions: {
				...store.sessionCompletions,
				[sessionKey]: {
					...(store.sessionCompletions[sessionKey] ?? EMPTY_SESSION_COMPLETIONS),
					[stepId]: state,
				},
			},
		})),
	clearSessionCompletions: (sessionKey) =>
		set((store) => ({
			sessionCompletions: {
				...store.sessionCompletions,
				[sessionKey]: EMPTY_SESSION_COMPLETIONS,
			},
		})),
	extraAssignmentGrades: {},
	setExtraAssignmentGrade: (sessionKey, instanceId, state) =>
		set((store) => ({
			extraAssignmentGrades: {
				...store.extraAssignmentGrades,
				[sessionKey]: {
					...(store.extraAssignmentGrades[sessionKey] ??
						EMPTY_SESSION_COMPLETIONS),
					[instanceId]: state,
				},
			},
		})),
}))
