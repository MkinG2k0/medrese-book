import { describe, expect, it } from "vitest";

import {
  analyticsCompletionFilter,
  analyticsSessionFilter,
  countableCompletionWhere,
  countableSessionWhere,
} from "./filters";

describe("analytics-queries filters", () => {
  it("countableSessionWhere excludes adjustment sessions", () => {
    expect(countableSessionWhere).toEqual(
      expect.objectContaining({ isAdjustment: false }),
    );
  });

  it("countableCompletionWhere excludes prior credit completions", () => {
    expect(countableCompletionWhere).toEqual(
      expect.objectContaining({ isPriorCredit: false }),
    );
  });

  it("analyticsSessionFilter merges date range with isAdjustment:false", () => {
    const gte = new Date("2026-01-01T00:00:00.000Z");
    const lte = new Date("2026-01-31T23:59:59.999Z");

    expect(analyticsSessionFilter({ gte, lte })).toEqual({
      date: { gte, lte },
      isAdjustment: false,
    });
  });

  it("analyticsCompletionFilter merges createdAt range with isPriorCredit:false", () => {
    const gte = new Date("2026-01-01T00:00:00.000Z");
    const lte = new Date("2026-01-31T23:59:59.999Z");

    expect(analyticsCompletionFilter({ gte, lte })).toEqual({
      createdAt: { gte, lte },
      isPriorCredit: false,
    });
  });
});
