export async function getPushSubscription(): Promise<PushSubscription | null> {
	if (typeof window === 'undefined') return null
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

	const registration = await navigator.serviceWorker.getRegistration('/sw.js')
	if (!registration) return null

	return registration.pushManager.getSubscription()
}

export async function hasPushSubscription(): Promise<boolean> {
	return (await getPushSubscription()) !== null
}
