import { prisma } from "@/shared/lib/prisma";

export async function getDefaultLevelId(): Promise<string> {
  const level = await prisma.level.findFirst({
    orderBy: { number: "asc" },
  });

  if (!level) {
    throw new Error("В системе нет уровней обучения");
  }

  return level.id;
}
