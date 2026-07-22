export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'app-shell:sidebar-collapsed'

export function readSidebarCollapsed(): boolean | null {
	if (typeof window === 'undefined') return null

	try {
		const value = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)
		if (value === '1') return true
		if (value === '0') return false
		return null
	} catch {
		return null
	}
}

export function writeSidebarCollapsed(collapsed: boolean): void {
	if (typeof window === 'undefined') return

	try {
		localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
	} catch {
		/* ignore */
	}
}
