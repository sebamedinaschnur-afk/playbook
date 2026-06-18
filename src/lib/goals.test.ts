import { describe, it, expect } from "vitest";
import {
  monthsUntil,
  requiredMonthlyContribution,
  projectedValue,
  progressPct,
  isOnTrack,
  runwayMonths,
  goalSaved,
} from "./goals";

describe("goalSaved", () => {
  it("sums allocation amounts (progress on read)", () => {
    expect(goalSaved([500, 250, 0.5])).toBe(750.5);
  });
  it("is 0 with no allocations", () => {
    expect(goalSaved([])).toBe(0);
  });
  it("drops by the removed amount when an allocation is removed", () => {
    const before = goalSaved([500, 300]);
    const after = goalSaved([500]); // one allocation removed
    expect(before).toBe(800);
    expect(after).toBe(500);
  });
});

describe("monthsUntil", () => {
  it("counts whole months and floors at 0", () => {
    expect(monthsUntil(new Date(2027, 5, 1), new Date(2026, 5, 1))).toBe(12);
    expect(monthsUntil(new Date(2026, 8, 1), new Date(2026, 5, 1))).toBe(3);
    expect(monthsUntil(new Date(2025, 0, 1), new Date(2026, 5, 1))).toBe(0); // past
  });
});

describe("requiredMonthlyContribution", () => {
  it("returns the lump shortfall when no time remains", () => {
    expect(requiredMonthlyContribution(10000, 4000, 0)).toBe(6000);
  });

  it("is 0 when already funded (with growth)", () => {
    expect(requiredMonthlyContribution(10000, 12000, 24)).toBe(0);
  });

  it("with 0% growth equals straight-line funding", () => {
    // need 12000 over 24 months from 0 → 500/mo
    expect(requiredMonthlyContribution(12000, 0, 24, 0)).toBe(500);
  });

  it("requires less per month with compounding than straight-line", () => {
    const straight = requiredMonthlyContribution(12000, 0, 24, 0);
    const withGrowth = requiredMonthlyContribution(12000, 0, 24);
    expect(withGrowth).toBeLessThan(straight);
  });
});

describe("projectedValue", () => {
  it("compounds current savings + contributions", () => {
    // $0 start, $500/mo, 0% → exactly 12000
    expect(projectedValue(0, 500, 24, 0)).toBe(12000);
    // with growth it should exceed the straight-line total
    expect(projectedValue(0, 500, 24)).toBeGreaterThan(12000);
  });

  it("returns current savings when no months remain", () => {
    expect(projectedValue(3000, 500, 0)).toBe(3000);
  });
});

describe("progress + on-track", () => {
  it("computes a clamped progress percentage", () => {
    expect(progressPct(2500, 10000)).toBe(25);
    expect(progressPct(20000, 10000)).toBe(100);
    expect(progressPct(100, 0)).toBe(0);
  });

  it("flags on-track when projection meets the target", () => {
    expect(isOnTrack(10500, 10000)).toBe(true);
    expect(isOnTrack(9000, 10000)).toBe(false);
  });
});

describe("runwayMonths", () => {
  it("divides savings by monthly spending", () => {
    expect(runwayMonths(12000, 2000)).toBe(6);
  });
  it("is null when spending is unknown", () => {
    expect(runwayMonths(12000, 0)).toBeNull();
  });
});
