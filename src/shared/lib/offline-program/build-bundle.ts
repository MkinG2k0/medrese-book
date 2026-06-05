import type { PrismaClient } from '../../../../generated/prisma/client'

import type { StepDetail } from '@/entities/step'

import type { OfflineProgramBundle } from './types'

function collectAssetUrls(steps: StepDetail[]): string[] {
	const urls = new Set<string>()
	for (const step of steps) {
		for (const block of step.blocks) {
			const url = block.imageUrl ?? block.src
			if (url?.startsWith('/')) urls.add(url)
		}
	}
	return [...urls]
}

export async function buildOfflineProgramBundle(
	prisma: PrismaClient,
): Promise<OfflineProgramBundle> {
	const rows = await prisma.step.findMany({
		where: { isPublished: true },
		orderBy: { order: 'asc' },
		include: { blocks: { orderBy: { order: 'asc' } } },
	})

	const totalPublished = rows.length
	const steps: StepDetail[] = rows.map((row) => ({
		id: row.id,
		order: row.order,
		title: row.title,
		subtitle: row.subtitle,
		isPublished: row.isPublished,
		blocks: row.blocks.map((block) => ({
			id: block.id,
			type: block.type,
			value: block.value,
			imageUrl: block.imageUrl,
			caption: block.caption,
			translation: block.translation,
		})),
		totalPublished,
	}))

	const generatedAt = new Date().toISOString()

	return {
		version: `${totalPublished}-${generatedAt}`,
		generatedAt,
		totalPublished,
		steps,
		assetUrls: collectAssetUrls(steps),
	}
}
