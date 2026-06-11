import { describe, it, expect } from "vitest";
import { projectSavings } from "./projection";

describe("projectSavings", () => {
  it("returns 0 for non-positive inputs", () => {
    expect(projectSavings(0, 4)).toBe(0);
    expect(projectSavings(500, 0)).toBe(0);
    expect(projectSavings(-100, 4)).toBe(0);
  });

  it("with a 0% return equals simple sum of contributions", () => {
    expect(projectSavings(500, 4, 0)).toBe(500 * 48);
  });

  it("compounds monthly at the illustrative rate (annuity FV)", () => {
    // $1,200/mo for 4 years at 7% annual, compounded monthly.
    // FV = 1200 * ((1.0058333..^48 - 1)/0.0058333..) ≈ 66,209
    const fv = projectSavings(1200, 4);
    expect(fv).toBeGreaterThan(66000);
    expect(fv).toBeLessThan(66500);
  });

  it("grows with more years", () => {
    expect(projectSavings(500, 8)).toBeGreaterThan(projectSavings(500, 4));
  });
});
