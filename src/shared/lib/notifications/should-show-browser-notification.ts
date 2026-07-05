type BrowserNotificationContext = {
	pathname: string
	search: string
	hidden: boolean
}

function getBrowserNotificationContext(): BrowserNotificationContext | null {
	if (typeof document === 'undefined' || typeof window === 'undefined') return null

	return {
		pathname: window.location.pathname,
		search: window.location.search,
		hidden: document.visibilityState === 'hidden',
	}
}

export function shouldShowBrowserNotification(
	link: string | null | undefined,
	contextOverride?: BrowserNotificationContext,
): boolean {
	const context = contextOverride ?? getBrowserNotificationContext()
	if (!context) return false
	if (context.hidden) return true
	if (!link) return true

	try {
		const target = new URL(link, 'http://localhost')
		const currentSearch = context.search.startsWith('?')
			? context.search
			: `?${context.search}`
		const current = new URL(`${context.pathname}${currentSearch}`, 'http://localhost')

		if (target.pathname !== current.pathname) return true

		const targetConversation = target.searchParams.get('conversation')
		const currentConversation = current.searchParams.get('conversation')

		if (targetConversation || currentConversation) {
			return targetConversation !== currentConversation
		}

		return target.search !== current.search
	} catch {
		return true
	}
}
