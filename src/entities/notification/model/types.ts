export type NotificationItem = {
	id: string
	type: string
	title: string
	body: string
	link: string | null
	readAt: string | null
	createdAt: string
}

export type UnreadCountResponse = {
	count: number
}

export type MarkNotificationReadPayload =
	| { ids: string[] }
	| { all: true }
