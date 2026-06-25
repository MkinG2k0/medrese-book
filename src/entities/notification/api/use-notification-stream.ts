'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

const MAX_RETRIES = 3
const RECONNECT_DELAY_MS = 5000

export function useNotificationStream() {
	const queryClient = useQueryClient()
	const retriesRef = useRef(0)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		let es: EventSource | null = null
		let cancelled = false

		const connect = () => {
			if (cancelled) return
			es = new EventSource('/api/notifications/stream')

			es.onmessage = (event) => {
				retriesRef.current = 0
				try {
					const payload = JSON.parse(event.data) as {
						type?: string
						id?: string
					}
					if (payload.type === 'notification') {
						queryClient.invalidateQueries({ queryKey: ['notifications'] })
						queryClient.invalidateQueries({
							queryKey: ['notifications', 'unread-count'],
						})
					}
				} catch {
					// ignore malformed SSE payloads
				}
			}

			es.onerror = () => {
				es?.close()
				es = null
				if (cancelled || retriesRef.current >= MAX_RETRIES) return
				retriesRef.current += 1
				timeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
			}
		}

		connect()

		return () => {
			cancelled = true
			if (timeoutRef.current) clearTimeout(timeoutRef.current)
			es?.close()
		}
	}, [queryClient])
}
