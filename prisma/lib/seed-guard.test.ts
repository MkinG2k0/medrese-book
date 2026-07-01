import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertDestructiveSeedAllowed,
  getDestructiveSeedBlockReasons,
  isHardBlockedSeedEnvironment,
  isProductionDatabaseTarget,
} from "./seed-guard";

describe("seed-guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks demo seed when NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/dev");

    expect(isHardBlockedSeedEnvironment()).toBe(true);
    expect(() => assertDestructiveSeedAllowed("demo-seed")).toThrow(
      /Запрещено запускать/,
    );
  });

  it("blocks when DATABASE_URL matches PRODUCTION_DATABASE_URL", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://prod.example.com:5432/medrese?sslmode=require",
    );
    vi.stubEnv(
      "PRODUCTION_DATABASE_URL",
      "postgresql://prod.example.com:5432/medrese?sslmode=require",
    );

    expect(isProductionDatabaseTarget()).toBe(true);
    expect(getDestructiveSeedBlockReasons()).toContain(
      "DATABASE_URL совпадает с PRODUCTION_DATABASE_URL",
    );
    expect(() => assertDestructiveSeedAllowed("e2e-seed")).toThrow(
      /production-подобной БД/,
    );
  });

  it("allows destructive seed on local DB without production markers", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/medrese_test");

    expect(getDestructiveSeedBlockReasons()).toEqual([]);
    expect(() => assertDestructiveSeedAllowed("demo-seed")).not.toThrow();
  });

  it("allows override with ALLOW_DESTRUCTIVE_SEED on non-production runtime", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DESTRUCTIVE_SEED", "1");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://prod.example.com:5432/medrese?sslmode=require",
    );
    vi.stubEnv(
      "PRODUCTION_DATABASE_URL",
      "postgresql://prod.example.com:5432/medrese?sslmode=require",
    );

    expect(() => assertDestructiveSeedAllowed("demo-seed")).not.toThrow();
  });
});
