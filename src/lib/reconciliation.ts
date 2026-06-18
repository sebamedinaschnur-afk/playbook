// Reconciliation matching (addendum §5) + income-counting transitions (§6).
// Pure + unit-tested. Works in MAGNITUDES: a manual payment amount is positive,
// and a Plaid inflow is negative in our convention — callers pass the inflow's
// magnitude (Math.abs) so the comparison is sign-agnostic.

const DAY_MS = 86_400_000;

export function daysBetween(a: Date, b: Date): number {
  return Math.abs((a.getTime() - b.getTime()) / DAY_MS);
}

// Tolerance: within ±5% OR ±$25, whichever is larger (§7 / §5.1).
export function amountTolerance(amount: number): number {
  return Math.max(amount * 0.05, 25);
}

export type MatchPayment = { amount: number; occurredOn: Date };
export type MatchTxn = { id: string; magnitude: number; date: Date };
export type RankedCandidate = {
  txnId: string;
  amountDistance: number;
  dateDistance: number;
  score: number;
};

export function qualifies(p: MatchPayment, t: MatchTxn): boolean {
  return (
    Math.abs(t.magnitude - p.amount) <= amountTolerance(p.amount) &&
    daysBetween(t.date, p.occurredOn) <= 7
  );
}

/**
 * Rank qualifying candidates for a payment, best (lowest score) first.
 * Score combines normalized amount + date distance (§5.2).
 */
export function rankCandidates(p: MatchPayment, txns: MatchTxn[]): RankedCandidate[] {
  const tol = amountTolerance(p.amount);
  return txns
    .map((t) => {
      const amountDistance = Math.abs(t.magnitude - p.amount);
      const dateDistance = daysBetween(t.date, p.occurredOn);
      return {
        txnId: t.id,
        amountDistance,
        dateDistance,
        score: amountDistance / tol + dateDistance / 7,
      };
    })
    .filter((c) => c.amountDistance <= tol && c.dateDistance <= 7)
    .sort((a, b) => a.score - b.score);
}

export function bestCandidate(p: MatchPayment, txns: MatchTxn[]): RankedCandidate | null {
  return rankCandidates(p, txns)[0] ?? null;
}

// --- Income counting across reconciliation states (§4.5, §6, §7) ---------------

export type ReconcileStatus = "ACTIVE" | "MERGED" | "KEPT_SEPARATE";

// A manual payment is always genuine income (locked decision §2.2 — "across
// income events"; §4.5 — a kept-separate entry is genuine cash that stands).
// MERGED still counts (it carries its own set-aside); the duplicate BANK line is
// what gets excluded (see txnCountsAsIncome). This resolves §3.3's "ACTIVE/MERGED"
// wording in favor of the locked decision so genuine cash never stops counting.
export function paymentCountsAsIncome(status: ReconcileStatus): boolean {
  return status === "ACTIVE" || status === "MERGED" || status === "KEPT_SEPARATE";
}

// A Plaid inflow counts as income only if tagged NIL and NOT merged into a
// manual payment (merging excludes it to avoid double counting, §4.5).
export function txnCountsAsIncome(
  reconciledManualPaymentId: string | null,
  incomeTag: "UNTAGGED" | "NIL_INCOME" | "NOT_INCOME",
): boolean {
  if (reconciledManualPaymentId) return false;
  return incomeTag === "NIL_INCOME";
}
