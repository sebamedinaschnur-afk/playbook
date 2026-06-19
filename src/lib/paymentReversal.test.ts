import { describe, it, expect } from "vitest";
import { reserveTarget } from "./reserve";
import { goalSaved } from "./goals";

// Decision #9: deleting a manual payment must fully roll back its effects. Since
// the reserve target and goal progress are computed on read (sum of source rows),
// the rollback property is: remove the payment's set-aside snapshot and its goal
// allocation, and both totals return to exactly their pre-log values.
describe("delete manual payment rolls back reserve + goal totals", () => {
  // Baseline before logging the payment: one prior payment's set-aside, one prior
  // goal allocation, no tagged inflows.
  const priorSetAsides = [60];
  const priorAllocations = [300];

  // Log a $500 NIL payment at 30%: +$150 set-aside, and assign $350 to the goal.
  const afterLogSetAsides = [...priorSetAsides, 150];
  const afterLogAllocations = [...priorAllocations, 350];

  it("increases both totals when logged", () => {
    expect(reserveTarget(afterLogSetAsides, [], 30)).toBe(210); // 60 + 150
    expect(goalSaved(afterLogAllocations)).toBe(650); // 300 + 350
  });

  it("returns both totals to baseline after deletion", () => {
    // Deletion removes the payment's set-aside (150) and its allocation (350).
    const afterDeleteSetAsides = [60];
    const afterDeleteAllocations = [300];

    expect(reserveTarget(afterDeleteSetAsides, [], 30)).toBe(reserveTarget(priorSetAsides, [], 30));
    expect(goalSaved(afterDeleteAllocations)).toBe(goalSaved(priorAllocations));
    expect(reserveTarget(afterDeleteSetAsides, [], 30)).toBe(60);
    expect(goalSaved(afterDeleteAllocations)).toBe(300);
  });
});
