'use client'

import { Image } from 'antd'

export type MessageMediaItem = {
	id: string
	url: string
	sortOrder: number
}

type MessageMediaGridProps = {
	media: MessageMediaItem[]
}

export function MessageMediaGrid({ media }: MessageMediaGridProps) {
	const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder)
	if (sorted.length === 0) return null

	const cols =
		sorted.length === 1 ? 'grid-cols-1' : sorted.length === 2 ? 'grid-cols-2' : 'grid-cols-2'

	return (
		<Image.PreviewGroup>
			<div className={`mb-2 grid gap-1 ${cols}`}>
				{sorted.map((item) => (
					<Image
						key={item.id}
						src={item.url}
						alt="Фото"
						className="max-h-48 w-full rounded object-cover"
					/>
				))}
			</div>
		</Image.PreviewGroup>
	)
}
