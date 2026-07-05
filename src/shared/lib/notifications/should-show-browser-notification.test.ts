import { describe, expect, it } from 'vitest'

import { shouldShowBrowserNotification } from './should-show-browser-notification'

describe('shouldShowBrowserNotification', () => {
	it('returns false on the same messages conversation', () => {
		const link = '/messages?conversation=abc123'
		expect(
			shouldShowBrowserNotification(link, {
				pathname: '/messages',
				search: '?conversation=abc123',
				hidden: false,
			}),
		).toBe(false)
	})

	it('returns true on a different messages conversation', () => {
		const link = '/messages?conversation=abc123'
		expect(
			shouldShowBrowserNotification(link, {
				pathname: '/messages',
				search: '?conversation=other',
				hidden: false,
			}),
		).toBe(true)
	})

	it('returns true when the tab is hidden', () => {
		expect(
			shouldShowBrowserNotification('/messages?conversation=abc123', {
				pathname: '/messages',
				search: '?conversation=abc123',
				hidden: true,
			}),
		).toBe(true)
	})
})
