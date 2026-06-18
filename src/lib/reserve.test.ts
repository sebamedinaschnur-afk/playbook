import { describe, it, expect } from "vitest";
import { reserveTarget, reserveMarked, computeReserve } from "./reserve";

describe("reserveTarget", () => {
  it("sums manual set-aside snapshots", () => {
    expect(reserveTarget([125, 60, 15], [], 30)).toBe(200);
  });

  it("adds rate% of tagged NIL inflows", () => {
    // $1,000 tagged inflow at 30% → 300; plus a $150 manual set-aside → 450
    expect(reserveTarget([150], [1000], 30)).toBe(450);
  });

  it("uses the supplied rate for tagged inflows", () => {
    expect(reserveTarget([], [1000], 25)).toBe(250);
  });

  it("is 0 with no income events", () => {
    expect(reserveTarget([], [], 30)).toBe(0);
  });
});

describe("reserveMarked", () => {
  it("sums all marks", () => {
    expect(reserveMarked([100, 25, 0.5])).toBe(125.5);
  });
});

describe("computeReserve", () => {
  it("computes remaining and percentage", () => {
    const r = computeReserve([200], [], 30, [50]);
    expect(r.target).toBe(200);
    expect(r.marked).toBe(50);
    expect(r.remaining).toBe(150);
    expect(r.pct).toBeCloseTo(25);
  });

  it("floors remaining at 0 and caps pct at 100 when over-marked", () => {
    const r = computeReserve([100], [], 30, [120]);
    expect(r.remaining).toBe(0);
    expect(r.pct).toBe(100);
  });

  it("reflects a removed mark (recomputed from the remaining set)", () => {
    const before = computeReserve([200], [], 30, [50, 50]);
    expect(before.marked).toBe(100);
    const after = computeReserve([200], [], 30, [50]); // one mark removed
    expect(after.marked).toBe(50);
    expect(after.remaining).toBe(150);
  });

  it("has no target when there is no income", () => {
    const r = computeReserve([], [], 30, []);
    expect(r.target).toBe(0);
    expect(r.pct).toBe(0);
  });
});
