import { describe, it, expect } from "vitest";
import {
  taxSetAsidePct,
  taxSetAsideDollars,
  monthlySavingsRate,
  monthlySavingsTarget,
  spendingThreshold,
  generateRules,
  explainSpendingThreshold,
  DEFAULT_TAX_RATE,
  SPENDING_THRESHOLD_FLOOR,
} from "./rules";

describe("tax set-aside", () => {
  it("defaults to 30%", () => {
    expect(taxSetAsidePct()).toBe(DEFAULT_TAX_RATE);
    expect(taxSetAsidePct()).toBe(30);
  });

  it("computes dollar amount at the default rate", () => {
    expect(taxSetAsideDollars(4000)).toBe(1200);
    expect(taxSetAsideDollars(0)).toBe(0);
  });

  it("honors a custom rate", () => {
    expect(taxSetAsideDollars(4000, 25)).toBe(1000);
  });
});

describe("monthly savings", () => {
  it("uses 25% when horizon is 4 years or less", () => {
    expect(monthlySavingsRate(4)).toBe(25);
    expect(monthlySavingsRate(1)).toBe(25);
    expect(monthlySavingsTarget(4000, 4)).toBe(1000);
  });

  it("uses 20% when horizon is more than 4 years", () => {
    expect(monthlySavingsRate(5)).toBe(20);
    expect(monthlySavingsTarget(4000, 8)).toBe(800);
  });

  it("is zero when there is no NIL income", () => {
    expect(monthlySavingsTarget(0, 4)).toBe(0);
  });
});

describe("spending threshold", () => {
  it("is 50% of monthly NIL when that exceeds the floor", () => {
    expect(spendingThreshold(4000)).toBe(2000);
    expect(spendingThreshold(10000)).toBe(5000);
  });

  it("never drops below the $1,500 floor", () => {
    expect(spendingThreshold(0)).toBe(SPENDING_THRESHOLD_FLOOR);
    expect(spendingThreshold(2000)).toBe(1500); // 50% = 1000 < floor
    expect(spendingThreshold(3000)).toBe(1500); // 50% = 1500 == floor
  });

  it("explanation notes the floor only when the floor is binding", () => {
    expect(explainSpendingThreshold(1500, 1000)).toContain("minimum");
    expect(explainSpendingThreshold(2000, 4000)).toContain("50%");
  });
});

describe("generateRules", () => {
  it("produces the three rules with explanations", () => {
    const r = generateRules(4000, 4);
    expect(r.taxSetAsidePct).toBe(30);
    expect(r.monthlySavings).toBe(1000);
    expect(r.spendingThreshold).toBe(2000);
    expect(r.explanations.taxSetAside).toContain("30%");
    expect(r.explanations.monthlySavings).toContain("$1,000");
    expect(r.explanations.spendingThreshold).toContain("$2,000");
  });

  it("longer horizon lowers the savings target", () => {
    const short = generateRules(6000, 3);
    const long = generateRules(6000, 9);
    expect(short.monthlySavings).toBeGreaterThan(long.monthlySavings);
    expect(short.monthlySavings).toBe(1500); // 25%
    expect(long.monthlySavings).toBe(1200); // 20%
  });
});
