// Goal math for the "Next Season" section. Pure + unit-tested (spec §4 posture:
// financial math is tested). Illustrative growth only — not financial advice.
import { ILLUSTRATIVE_ANNUAL_RATE } from "@/lib/projection";

export function monthsUntil(target: Date, now: Date): number {
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(0, months);
}

/**
 * Monthly contribution needed to reach `targetAmount` by the target date, given
 * what's already saved (compounded) over `months` at `annualRate`.
 */
export function requiredMonthlyContribution(
  targetAmount: number,
  currentSaved: number,
  months: number,
  annualRate: number = ILLUSTRATIVE_ANNUAL_RATE,
): number {
  if (months <= 0) {
    return Math.max(0, Math.round(targetAmount - currentSaved));
  }
  const r = annualRate / 12;
  const fvCurrent = currentSaved * Math.pow(1 + r, months);
  const remaining = targetAmount - fvCurrent;
  if (remaining <= 0) return 0;
  const pmt = r === 0 ? remaining / months : (remaining * r) / (Math.pow(1 + r, months) - 1);
  return Math.round(pmt);
}

/** Projected value of `currentSaved` + `monthly` contributions over `months`. */
export function projectedValue(
  currentSaved: number,
  monthly: number,
  months: number,
  annualRate: number = ILLUSTRATIVE_ANNUAL_RATE,
): number {
  if (months <= 0) return Math.round(currentSaved);
  const r = annualRate / 12;
  const fvCurrent = currentSaved * Math.pow(1 + r, months);
  const fvContrib = r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
  return Math.round(fvCurrent + fvContrib);
}

export function progressPct(currentSaved: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.max(0, (currentSaved / targetAmount) * 100));
}

export function isOnTrack(projected: number, targetAmount: number): boolean {
  return projected >= targetAmount;
}

// --- Career runway (the honest "after the game" view) -----------------------

/**
 * How many months current savings would cover if sport income stopped today.
 * null when spending is unknown/zero (can't compute a meaningful runway).
 */
export function runwayMonths(trackedBalance: number, monthlySpending: number): number | null {
  if (monthlySpending <= 0) return null;
  return Math.floor(trackedBalance / monthlySpending);
}
