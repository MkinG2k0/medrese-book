import { prisma } from "@/shared/lib/prisma";

export async function getStepOffsetForLevel(levelNumber: number): Promise<number> {
  return prisma.step.count({
    where: { level: { number: { lt: levelNumber } } },
  });
}

export async function getTotalProgramSteps(): Promise<number> {
  return prisma.step.count();
}

export async function getLevelStepOffsets(): Promise<Map<number, number>> {
  const levels = await prisma.level.findMany({
    select: { number: true, _count: { select: { steps: true } } },
    orderBy: { number: "asc" },
  });

  const offsets = new Map<number, number>();
  let cumulative = 0;
  for (const level of levels) {
    offsets.set(level.number, cumulative);
    cumulative += level._count.steps;
  }
  return offsets;
}

export function toGlobalStepNumber(
  stepOffset: number,
  localOrder: number,
): number {
  return stepOffset + localOrder;
}

export function getLocalStepIdx(
  globalStepIdx: number,
  stepOffset: number,
): number {
  return globalStepIdx - stepOffset;
}
