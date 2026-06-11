// Career-timeline savings projection (spec §2.6). Illustrative only.
// Future value of a monthly contribution series compounded monthly.

export const ILLUSTRATIVE_ANNUAL_RATE = 0.07; // 7% — illustrative, disclosed in UI

/**
 * Future value of contributing `monthly` dollars every month for `years`,
 * compounded monthly at `annualRate`. Returns a rounded dollar amount.
 */
export function projectSavings(
  monthly: number,
  years: number,
  annualRate: number = ILLUSTRATIVE_ANNUAL_RATE,
): number {
  const n = Math.round(years * 12);
  if (n <= 0 || monthly <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return Math.round(monthly * n);
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r);
  return Math.round(fv);
}
