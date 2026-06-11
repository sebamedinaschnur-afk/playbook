// Deterministic starting-rules engine (spec §2.4). No AI — simple, explainable math.
// Pure functions so the financial logic can be unit-tested (spec §4 testing requirement).

export const DEFAULT_TAX_RATE = 30; // percent
export const SPENDING_THRESHOLD_FLOOR = 1500; // dollars/month

export type RuleValues = {
  taxSetAsidePct: number; // percent of each NIL payment
  monthlySavings: number; // dollars/month
  spendingThreshold: number; // dollars/month
};

export type GeneratedRule = RuleValues & {
  explanations: {
    taxSetAside: string;
    monthlySavings: string;
    spendingThreshold: string;
  };
};

/** Tax set-aside: default 30% of estimated NIL income. */
export function taxSetAsidePct(): number {
  return DEFAULT_TAX_RATE;
}

/** Dollar amount to set aside per payment, given a per-payment (monthly) figure. */
export function taxSetAsideDollars(estMonthlyNil: number, pct = DEFAULT_TAX_RATE): number {
  return Math.round((estMonthlyNil * pct) / 100);
}

/** Suggested monthly savings rate (percent) from career horizon. */
export function monthlySavingsRate(careerHorizonYears: number): number {
  return careerHorizonYears <= 4 ? 25 : 20;
}

/**
 * Monthly savings target derived from career horizon: shorter horizon → save more.
 * 25% of estimated monthly NIL if horizon <= 4 years, else 20%.
 */
export function monthlySavingsTarget(estMonthlyNil: number, careerHorizonYears: number): number {
  return Math.round(estMonthlyNil * (monthlySavingsRate(careerHorizonYears) / 100));
}

/** Spending threshold: 50% of estimated monthly NIL, with a $1,500 floor. */
export function spendingThreshold(estMonthlyNil: number): number {
  return Math.max(Math.round(estMonthlyNil * 0.5), SPENDING_THRESHOLD_FLOOR);
}

// --- Plain-English "why" builders (recomputed when a user edits a value) -------

export function explainTaxSetAside(pct: number, estMonthlyNil: number): string {
  const dollars = taxSetAsideDollars(estMonthlyNil, pct);
  return `NIL income is paid untaxed — setting aside ${pct}% (about $${dollars.toLocaleString()} of every $${estMonthlyNil.toLocaleString()} payment) covers your federal + state estimates.`;
}

export function explainMonthlySavings(
  savings: number,
  estMonthlyNil: number,
  careerHorizonYears: number,
): string {
  const yrs = careerHorizonYears;
  return `With about ${yrs} earning year${yrs === 1 ? "" : "s"} ahead, saving $${savings.toLocaleString()}/mo builds a cushion while the money is coming in.`;
}

export function explainSpendingThreshold(threshold: number, estMonthlyNil: number): string {
  const atFloor = threshold === SPENDING_THRESHOLD_FLOOR && estMonthlyNil * 0.5 < SPENDING_THRESHOLD_FLOOR;
  return `We'll alert you if monthly spending passes $${threshold.toLocaleString()}${atFloor ? ` (a $${SPENDING_THRESHOLD_FLOOR.toLocaleString()} minimum)` : ` — about 50% of your estimated NIL income`}, the line that keeps your plan on track.`;
}

/** Generate the three starting rules plus a plain-English "why" for each. */
export function generateRules(
  estMonthlyNil: number,
  careerHorizonYears: number,
): GeneratedRule {
  const taxPct = taxSetAsidePct();
  const savings = monthlySavingsTarget(estMonthlyNil, careerHorizonYears);
  const threshold = spendingThreshold(estMonthlyNil);

  return {
    taxSetAsidePct: taxPct,
    monthlySavings: savings,
    spendingThreshold: threshold,
    explanations: {
      taxSetAside: explainTaxSetAside(taxPct, estMonthlyNil),
      monthlySavings: explainMonthlySavings(savings, estMonthlyNil, careerHorizonYears),
      spendingThreshold: explainSpendingThreshold(threshold, estMonthlyNil),
    },
  };
}
