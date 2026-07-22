export type MessagePreviewInput = {
	body: string
	mediaCount: number
	variant?: 'list' | 'notify'
}

export function formatMessagePreview({
	body,
	mediaCount,
	variant = 'list',
}: MessagePreviewInput): string {
	const trimmed = body.trim()
	if (trimmed.length > 0) return trimmed

	if (mediaCount < 1) return ''

	if (variant === 'notify') {
		return mediaCount === 1 ? 'Фото' : `${mediaCount} фото`
	}

	return mediaCount === 1 ? '📷 Фото' : `📷 ${mediaCount} фото`
}
