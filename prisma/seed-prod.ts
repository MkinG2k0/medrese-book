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

function resolveSuperAdminCode(): string {
  const raw =
    process.env.SUPER_ADMIN_CODE ?? process.env.SUPER_ADMIN_PASSWORD ?? "";
  const code = raw.replace(/\D/g, "");

  if (!/^\d{6}$/.test(code)) {
    throw new Error(
      "SUPER_ADMIN_CODE (или SUPER_ADMIN_PASSWORD) должен быть 6-значным кодом доступа",
    );
  }

  return code;
}

const SUPER_ADMIN_NAME = "Супер-админ";

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
  const code = resolveSuperAdminCode();

  const quranSubject = await ensureQuranSubject();
  const programResult = await seedProgram(prisma, {
    subjectId: quranSubject.id,
    skipIfExists: true,
  });
  console.log(formatProgramSeedSummary(programResult));

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    if (existingSuperAdmin.code === code) {
      console.log(
        `Production seed: супер-админ уже существует (${existingSuperAdmin.name}, код ${code})`,
      );
      return;
    }

    throw new Error(
      "Супер-админ уже существует с другим кодом. Обновите код вручную или удалите пользователя.",
    );
  }

  const codeTaken = await prisma.user.findUnique({
    where: { code },
    select: { id: true, role: true },
  });

  if (codeTaken) {
    throw new Error(
      `Код ${code} уже занят пользователем с ролью ${codeTaken.role}`,
    );
  }

  const superAdmin = await prisma.user.create({
    data: { name: SUPER_ADMIN_NAME, code, role: "SUPER_ADMIN" },
  });

  console.log("Production seed completed:");
  console.log(`  SUPER_ADMIN: ${superAdmin.name} (код: ${superAdmin.code})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
