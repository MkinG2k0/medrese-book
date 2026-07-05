'use client'

import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { showBrowserNotification } from '@/shared/lib/notifications/browser-notification'

const MAX_RETRIES = 3
const RECONNECT_DELAY_MS = 5000

type NotificationStreamPayload = {
	type?: string
	id?: string
	title?: string
	body?: string
	link?: string | null
}

function invalidateMessagingQueries(
	queryClient: QueryClient,
	link: string | null | undefined,
) {
	if (!link?.startsWith('/messages')) return

	queryClient.invalidateQueries({ queryKey: ['conversations'] })

	try {
		const conversationId = new URL(link, 'http://localhost').searchParams.get(
			'conversation',
		)
		if (conversationId) {
			queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
		} else {
			queryClient.invalidateQueries({ queryKey: ['messages'] })
		}
	} catch {
		queryClient.invalidateQueries({ queryKey: ['messages'] })
	}
}

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
					const payload = JSON.parse(event.data) as NotificationStreamPayload
					if (payload.type === 'notification') {
						queryClient.invalidateQueries({ queryKey: ['notifications'] })
						queryClient.invalidateQueries({
							queryKey: ['notifications', 'unread-count'],
						})
						invalidateMessagingQueries(queryClient, payload.link)

						if (payload.title) {
							showBrowserNotification({
								title: payload.title,
								body: payload.body ?? '',
								link: payload.link,
							})
						}
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
