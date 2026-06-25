self.addEventListener('fetch', (event) => {
	event.respondWith(fetch(event.request))
})

self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {}
	const title = data.title ?? 'Уведомление'
	const body = data.body ?? ''
	const url = data.url ?? '/'

	event.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon: '/icon.png',
			data: { url, notificationId: data.notificationId },
		}),
	)
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const url = event.notification.data?.url ?? '/'
	event.waitUntil(clients.openWindow(url))
})
