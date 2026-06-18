// Tax reserve math (addendum §2.2, §3.3). Pure + unit-tested. Both target and
// marked are computed on read from source records — never stored running totals,
// so editing/deleting a payment or a mark can't cause drift.

export type ReserveSummary = {
  target: number; // total the plan suggests setting aside
  marked: number; // total the user has self-reported moving
  remaining: number; // target - marked, floored at 0
  pct: number; // marked / target, 0..100
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/**
 * Reserve target = sum of set-aside snapshots on ACTIVE/MERGED manual payments,
 * plus (rate% × magnitude) of each Plaid inflow the user tagged NIL income.
 */
export function reserveTarget(
  manualSetAsides: number[],
  taggedInflowMagnitudes: number[],
  ratePct: number,
): number {
  return round2(sum(manualSetAsides) + sum(taggedInflowMagnitudes) * (ratePct / 100));
}

export function reserveMarked(marks: number[]): number {
  return round2(sum(marks));
}

export function computeReserve(
  manualSetAsides: number[],
  taggedInflowMagnitudes: number[],
  ratePct: number,
  marks: number[],
): ReserveSummary {
  const target = reserveTarget(manualSetAsides, taggedInflowMagnitudes, ratePct);
  const marked = reserveMarked(marks);
  const remaining = round2(Math.max(0, target - marked));
  const pct = target > 0 ? Math.min(100, (marked / target) * 100) : 0;
  return { target, marked, remaining, pct };
}
