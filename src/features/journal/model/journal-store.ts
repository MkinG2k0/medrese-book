import { create } from 'zustand'

type JournalStore = {
	selectedStudentId: string | null
	setSelectedStudentId: (id: string | null) => void
	dateFilter: string
	setDateFilter: (date: string) => void
}

export const useJournalStore = create<JournalStore>((set) => ({
	selectedStudentId: null,
	setSelectedStudentId: (id) => set({ selectedStudentId: id }),
	dateFilter: new Date().toISOString().split('T')[0]!,
	setDateFilter: (date) => set({ dateFilter: date }),
}))
