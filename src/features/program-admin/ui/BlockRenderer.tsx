'use client'

import Image from 'next/image'

import type { ContentBlock } from '@/shared/lib/validations/step'

type BlockRendererProps = {
	blocks: ContentBlock[]
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
	return (
		<div className="flex flex-col gap-4">
			{blocks.map((block, index) => {
				switch (block.type) {
					case 'text': {
						const isHeading = /^<h[1-6]>/.test(block.value)
						if (isHeading) {
							return (
								<div
									key={index}
									className="text-[#E8E0D0] [&_h1]:font-display [&_h1]:text-3xl [&_h2]:font-display [&_h2]:text-2xl [&_h3]:text-xl [&_strong]:font-bold [&_em]:italic"
									dangerouslySetInnerHTML={{ __html: block.value }}
								/>
							)
						}
						return (
							<p
								key={index}
								className="text-[#E8E0D0] [&_strong]:font-bold [&_em]:italic"
								dangerouslySetInnerHTML={{ __html: block.value }}
							/>
						)
					}
					case 'arabic': {
						const sizeClass =
							block.size === 'xl'
								? 'text-4xl'
								: block.size === 'lg'
									? 'text-3xl'
									: 'text-2xl'
						return (
							<div
								key={index}
								dir="rtl"
								className={`font-[family-name:var(--font-arabic)] ${sizeClass} text-[#E8E0D0]`}
								style={{ fontFamily: 'Amiri, serif' }}
							>
								{block.value}
							</div>
						)
					}
					case 'image':
						return (
							<figure key={index} className="flex flex-col gap-2">
								<Image
									src={block.url}
									alt={block.caption ?? 'Изображение'}
									width={600}
									height={400}
									className="rounded-lg"
								/>
								{block.caption && (
									<figcaption className="text-sm text-[#8a8375]">{block.caption}</figcaption>
								)}
							</figure>
						)
					case 'list':
						return (
							<ul key={index} className="list-disc pl-6 text-[#E8E0D0]">
								{block.items.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
						)
					default:
						return null
				}
			})}
		</div>
	)
}
