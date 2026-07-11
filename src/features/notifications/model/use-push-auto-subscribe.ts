'use client'

import { useEffect, useRef } from 'react'

import { getPushSubscription } from '../lib/push-subscription-status'
import { usePushSubscribe } from './use-push-subscribe'

export function usePushAutoSubscribe() {
	const { subscribe } = usePushSubscribe()
	const attemptedRef = useRef(false)

	useEffect(() => {
		if (attemptedRef.current) return
		if (typeof window === 'undefined' || typeof Notification === 'undefined') return
		if (Notification.permission !== 'granted') return
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

		attemptedRef.current = true

		void (async () => {
			const existing = await getPushSubscription()
			if (existing) {
				const res = await fetch('/api/push/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(existing.toJSON()),
				})
				if (res.status === 401) return
				return
			}

			await subscribe()
		})()
	}, [subscribe])
}
