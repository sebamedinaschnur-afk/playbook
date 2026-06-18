// Deterministic alert computation (spec §2.5 + addendum §7). Pure + unit-tested.
// The caller persists these descriptors as Alert rows (deduped by dedupeKey).
import { upcomingDueDate } from "@/lib/quarterlyTax";

export type AlertType = "SPENDING" | "TAX_REMINDER" | "LARGE_DEPOSIT" | "TAG_INCOME";

export type IncomeTag = "UNTAGGED" | "NIL_INCOME" | "NOT_INCOME";

export type AlertDescriptor = {
  type: AlertType;
  title: string;
  body: string;
  dedupeKey: string; // stable so the same alert isn't created twice
};

export type AlertTransaction = {
  plaidTransactionId: string;
  amount: number; // Plaid convention: positive = money out, negative = money in
  date: Date;
  isTransfer: boolean;
  name: string;
  merchantName: string | null;
  incomeTag?: IncomeTag; // defaults to UNTAGGED
  isSelfTransfer?: boolean;
};

export type ComputeAlertsInput = {
  now: Date;
  monthlySpending: number;
  spendingThreshold: number;
  taxSetAsidePct: number;
  estMonthlyNil: number;
  recentTransactions: AlertTransaction[];
  // Effective (business-day-adjusted) quarterly due dates from QuarterlyTaxDate.
  // When omitted, falls back to the hardcoded statutory dates.
  taxDueDates?: Date[];
};

export const LARGE_DEPOSIT_MIN = 1000;

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// IRS quarterly estimated-tax due dates: Jan 15, Apr 15, Jun 15, Sep 15 (spec §2.5).
// Returns the due date if `now` falls within the 30 days before one, else null.
export function upcomingTaxDueDate(now: Date): Date | null {
  const y = now.getFullYear();
  const candidates = [
    new Date(y, 0, 15),
    new Date(y, 3, 15),
    new Date(y, 5, 15),
    new Date(y, 8, 15),
    new Date(y + 1, 0, 15), // covers the December window for next Jan 15
  ];
  for (const due of candidates) {
    const windowStart = new Date(due);
    windowStart.setDate(due.getDate() - 30);
    if (now >= windowStart && now <= due) return due;
  }
  return null;
}

export function computeAlerts(input: ComputeAlertsInput): AlertDescriptor[] {
  const { now, monthlySpending, spendingThreshold, taxSetAsidePct, estMonthlyNil } = input;
  const out: AlertDescriptor[] = [];

  // 1. Spending over threshold (one per calendar month).
  if (spendingThreshold > 0 && monthlySpending > spendingThreshold) {
    out.push({
      type: "SPENDING",
      title: "Spending over your limit",
      body: `You've spent ${usd(monthlySpending)} this month — past your ${usd(spendingThreshold)} threshold.`,
      dedupeKey: `SPENDING-${ym(now)}`,
    });
  }

  // 2. Quarterly tax reminder (within 30 days of a due date). Prefer the
  // table-driven, business-day-adjusted dates; fall back to statutory months.
  const due = input.taxDueDates ? upcomingDueDate(input.taxDueDates, now) : upcomingTaxDueDate(now);
  if (due) {
    const monthlyTax = Math.round((estMonthlyNil * taxSetAsidePct) / 100);
    out.push({
      type: "TAX_REMINDER",
      title: "Quarterly taxes due soon",
      body: `Estimated taxes are due ${fmtDate(due)}. Your plan sets aside ${taxSetAsidePct}% (~${usd(monthlyTax)}/mo) — make sure it's ready.`,
      dedupeKey: `TAX-${due.toISOString().slice(0, 10)}`,
    });
  }

  // 3. Large inflow (>= $1,000), excluding transfers and self-transfers.
  //    UNTAGGED  → prompt the user to tag it (§7). NIL_INCOME → set-aside nudge.
  for (const t of input.recentTransactions) {
    const isInflow = !t.isTransfer && !t.isSelfTransfer && t.amount <= -LARGE_DEPOSIT_MIN;
    if (!isInflow) continue;
    const amount = Math.abs(t.amount);
    const who = t.merchantName ?? t.name;
    const tag = t.incomeTag ?? "UNTAGGED";

    if (tag === "UNTAGGED") {
      out.push({
        type: "TAG_INCOME",
        title: "Is this NIL income?",
        body: `${usd(amount)} from ${who} landed in your bank. Tag it so your tax plan stays accurate.`,
        dedupeKey: `TAG-${t.plaidTransactionId}`,
      });
    } else if (tag === "NIL_INCOME") {
      const setAside = Math.round((amount * taxSetAsidePct) / 100);
      out.push({
        type: "LARGE_DEPOSIT",
        title: "Large NIL deposit",
        body: `${usd(amount)} from ${who} — consider setting aside ${taxSetAsidePct}% (~${usd(setAside)}) for taxes.`,
        dedupeKey: `DEPOSIT-${t.plaidTransactionId}`,
      });
    }
  }

  return out;
}
