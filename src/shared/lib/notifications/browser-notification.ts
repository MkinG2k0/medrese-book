import { shouldShowBrowserNotification } from './should-show-browser-notification'

type BrowserNotificationPayload = {
	title: string
	body: string
	link?: string | null
}

export function showBrowserNotification({
	title,
	body,
	link,
}: BrowserNotificationPayload): void {
	if (typeof window === 'undefined' || typeof Notification === 'undefined') return
	if (Notification.permission !== 'granted') return
	if (!shouldShowBrowserNotification(link)) return

	const notification = new Notification(title, {
		body,
		icon: '/icon.png',
		data: { url: link ?? '/' },
	})

	notification.onclick = () => {
		window.focus()
		if (link) {
			window.location.assign(link)
		}
		notification.close()
	}
}
