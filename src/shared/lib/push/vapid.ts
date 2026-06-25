import webpush from 'web-push'

let vapidInitialized = false

export function ensureVapidConfigured(): void {
	if (vapidInitialized) return

	const subject = process.env.VAPID_SUBJECT
	const publicKey = process.env.VAPID_PUBLIC_KEY
	const privateKey = process.env.VAPID_PRIVATE_KEY

	if (!subject || !publicKey || !privateKey) {
		if (process.env.NODE_ENV === 'development') {
			throw new Error(
				'VAPID не настроен: задайте VAPID_SUBJECT, VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в env',
			)
		}
		return
	}

	webpush.setVapidDetails(subject, publicKey, privateKey)
	vapidInitialized = true
}

export function getVapidPublicKey(): string | null {
	return process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
}
