import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  formatProgramSeedSummary,
  seedProgram,
} from "./lib/seed-program";
import { DEFAULT_QURAN_SUBJECT_ID } from "./lib/subject-constants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function ensureQuranSubject() {
  return prisma.subject.upsert({
    where: { id: DEFAULT_QURAN_SUBJECT_ID },
    create: {
      id: DEFAULT_QURAN_SUBJECT_ID,
      name: "Коран",
      description: "Полная программа изучения Корана",
    },
    update: {},
  });
}

async function main() {
  const force = process.argv.includes("--force");
  const quranSubject = await ensureQuranSubject();
  const result = await seedProgram(prisma, {
    subjectId: quranSubject.id,
    skipIfExists: !force,
    force,
  });
  console.log(formatProgramSeedSummary(result));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
