'use client'

import Image from 'next/image'

import type { PostMediaDto } from '@/entities/post'

type PostMediaGalleryProps = {
	media: PostMediaDto[]
}

export function PostMediaGallery({ media }: PostMediaGalleryProps) {
	if (media.length === 0) return null

	return (
		<div className="flex flex-col gap-4">
			{media.map((item) =>
				item.type === 'VIDEO' ? (
					<video
						key={item.id}
						controls
						className="w-full rounded-lg"
						src={item.url}
					>
						<track kind="captions" />
					</video>
				) : (
					<div key={item.id} className="relative w-full overflow-hidden rounded-lg">
						<Image
							src={item.url}
							alt=""
							width={800}
							height={500}
							className="h-auto w-full object-contain"
						/>
					</div>
				),
			)}
		</div>
	)
}
