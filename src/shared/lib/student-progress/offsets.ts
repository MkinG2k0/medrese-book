import { prisma } from '@/shared/lib/prisma'

let cachedOffsets: Map<number, number> | null = null
let cachedTotalProgramSteps: number | null = null

export function invalidateStepOffsetCache() {
	cachedOffsets = null
	cachedTotalProgramSteps = null
}

export async function getStepOffsetForLevel(
	levelNumber: number,
): Promise<number> {
	if (!cachedOffsets) {
		cachedOffsets = await getLevelStepOffsets()
	}
	return cachedOffsets.get(levelNumber) ?? 0
}

export async function getTotalProgramSteps(): Promise<number> {
	if (cachedTotalProgramSteps === null) {
		cachedTotalProgramSteps = await prisma.step.count()
	}
	return cachedTotalProgramSteps
}

export async function getLevelStepOffsets(): Promise<Map<number, number>> {
	const levels = await prisma.level.findMany({
		select: { number: true, _count: { select: { steps: true } } },
		orderBy: { number: 'asc' },
	})

	const offsets = new Map<number, number>()
	let cumulative = 0
	for (const level of levels) {
		offsets.set(level.number, cumulative)
		cumulative += level._count.steps
	}
	return offsets
}

export function toGlobalStepNumber(
	stepOffset: number,
	localOrder: number,
): number {
	return stepOffset + localOrder
}

export function getLocalStepIdx(
	globalStepIdx: number,
	stepOffset: number,
): number {
	return globalStepIdx - stepOffset
}
