import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  formatProgramSeedSummary,
  seedProgram,
} from "./lib/seed-program";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const force = process.argv.includes("--force");
  const result = await seedProgram(prisma, {
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
