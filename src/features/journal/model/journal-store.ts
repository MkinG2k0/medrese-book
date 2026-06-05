import { create } from 'zustand'

import { getLocalDateString } from '@/shared/lib/calendar-date'

type JournalStore = {
	selectedStudentId: string | null
	setSelectedStudentId: (id: string | null) => void
	dateFilter: string
	setDateFilter: (date: string) => void
}

export const useJournalStore = create<JournalStore>((set) => ({
	selectedStudentId: null,
	setSelectedStudentId: (id) => set({ selectedStudentId: id }),
	dateFilter: getLocalDateString(),
	setDateFilter: (date) => set({ dateFilter: date }),
}))
