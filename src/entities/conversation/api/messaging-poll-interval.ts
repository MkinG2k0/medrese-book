export const MESSAGING_POLL_MS = 30_000

/** Poll only while the tab is visible; SSE invalidates on new messages. */
export function messagingPollInterval(): number | false {
	if (typeof document === 'undefined') return MESSAGING_POLL_MS
	return document.visibilityState === 'visible' ? MESSAGING_POLL_MS : false
}
