import { prisma } from '@/shared/lib/prisma'
import { DEFAULT_QURAN_SUBJECT_ID } from '@/shared/lib/subject-constants'

const offsetCache = new Map<string, Map<number, number>>()
const totalStepsCache = new Map<string, number>()

export function invalidateStepOffsetCache(subjectId?: string) {
	if (subjectId) {
		offsetCache.delete(subjectId)
		totalStepsCache.delete(subjectId)
	} else {
		offsetCache.clear()
		totalStepsCache.clear()
	}
}

export async function getStepOffsetForLevel(
	levelNumber: number,
	subjectId?: string,
): Promise<number> {
	const sid = subjectId ?? DEFAULT_QURAN_SUBJECT_ID
	let cached = offsetCache.get(sid)
	if (!cached) {
		cached = await getLevelStepOffsets(sid)
		offsetCache.set(sid, cached)
	}
	return cached.get(levelNumber) ?? 0
}

export async function getTotalProgramSteps(subjectId?: string): Promise<number> {
	const sid = subjectId ?? DEFAULT_QURAN_SUBJECT_ID
	const cached = totalStepsCache.get(sid)
	if (cached !== undefined) return cached

	const count = await prisma.step.count({
		where: { level: { subjectId: sid } },
	})
	totalStepsCache.set(sid, count)
	return count
}

export async function getLevelStepOffsets(
	subjectId: string,
): Promise<Map<number, number>> {
	const levels = await prisma.level.findMany({
		where: { subjectId },
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
