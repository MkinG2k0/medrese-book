export type DestructiveSeedScript = "demo-seed" | "e2e-seed";

const SCRIPT_LABELS: Record<DestructiveSeedScript, string> = {
  "demo-seed": "pnpm db:seed (демо-seed)",
  "e2e-seed": "pnpm db:seed:e2e",
};

function databaseFingerprint(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return null;
  }
}

function parseBlockedHosts(): string[] {
  return (process.env.SEED_BLOCKED_DB_HOSTS ?? "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

/** Жёсткая блокировка: production runtime (Docker, Vercel и т.д.). */
export function isHardBlockedSeedEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.APP_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** БД похожа на production — по явной метке или списку хостов. */
export function isProductionDatabaseTarget(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  const productionReference = process.env.PRODUCTION_DATABASE_URL;
  if (productionReference) {
    const current = databaseFingerprint(databaseUrl);
    const reference = databaseFingerprint(productionReference);
    if (current && reference && current === reference) {
      return true;
    }
  }

  const host = databaseFingerprint(databaseUrl)?.split("/")[0]?.toLowerCase();
  if (!host) return false;

  return parseBlockedHosts().some(
    (blocked) => host === blocked || host.includes(blocked),
  );
}

export function getDestructiveSeedBlockReasons(): string[] {
  const reasons: string[] = [];

  if (process.env.NODE_ENV === "production") {
    reasons.push("NODE_ENV=production");
  }
  if (process.env.APP_ENV === "production") {
    reasons.push("APP_ENV=production");
  }
  if (process.env.VERCEL_ENV === "production") {
    reasons.push("VERCEL_ENV=production");
  }

  const databaseUrl = process.env.DATABASE_URL;
  const productionReference = process.env.PRODUCTION_DATABASE_URL;

  if (databaseUrl && productionReference) {
    const current = databaseFingerprint(databaseUrl);
    const reference = databaseFingerprint(productionReference);
    if (current && reference && current === reference) {
      reasons.push("DATABASE_URL совпадает с PRODUCTION_DATABASE_URL");
    }
  }

  const host = databaseUrl ? databaseFingerprint(databaseUrl)?.split("/")[0] : null;
  const blockedHosts = parseBlockedHosts();
  if (host && blockedHosts.some((blocked) => host === blocked || host.includes(blocked))) {
    reasons.push(`хост БД в SEED_BLOCKED_DB_HOSTS (${host})`);
  }

  return reasons;
}

/**
 * Запрещает demo/e2e seed на production.
 * На prod допустимы только db:seed:prod и db:seed:program (идемпотентные).
 */
export function assertDestructiveSeedAllowed(script: DestructiveSeedScript): void {
  const label = SCRIPT_LABELS[script];
  const reasons = getDestructiveSeedBlockReasons();

  if (reasons.length === 0) return;

  if (isHardBlockedSeedEnvironment()) {
    throw new Error(
      [
        `Запрещено запускать ${label} в production-окружении.`,
        "Этот seed удаляет все данные в БД.",
        "",
        "Причины:",
        ...reasons.map((reason) => `  • ${reason}`),
        "",
        "На production используйте: pnpm db:seed:prod или pnpm db:seed:program",
      ].join("\n"),
    );
  }

  if (process.env.ALLOW_DESTRUCTIVE_SEED === "1") {
    console.warn(
      `[seed-guard] ВНИМАНИЕ: ${label} запущен на production-подобной БД (ALLOW_DESTRUCTIVE_SEED=1).`,
    );
    return;
  }

  throw new Error(
    [
      `Запрещено запускать ${label} на production-подобной БД.`,
      "Этот seed удаляет все данные.",
      "",
      "Причины:",
      ...reasons.map((reason) => `  • ${reason}`),
      "",
      "Если вы уверены (локальный снимок prod): ALLOW_DESTRUCTIVE_SEED=1",
      "На production: pnpm db:seed:prod или pnpm db:seed:program",
    ].join("\n"),
  );
}
