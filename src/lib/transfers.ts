// Self-transfer detection (addendum §7). Pure + unit-tested. A positive and a
// negative transaction of equal magnitude between two of the user's OWN accounts
// within 3 days is money moving between their accounts — both are flagged and
// excluded from income and spending.

const DAY_MS = 86_400_000;
const EPS = 0.005;

export type TxnForTransfer = {
  id: string;
  accountId: string;
  amount: number; // signed: positive = money out, negative = money in
  date: Date;
};

function daysBetween(a: Date, b: Date): number {
  return Math.abs((a.getTime() - b.getTime()) / DAY_MS);
}

// Returns the set of transaction ids that are self-transfers.
export function detectSelfTransfers(txns: TxnForTransfer[]): Set<string> {
  const flagged = new Set<string>();
  const outflows = txns.filter((t) => t.amount > 0);
  const inflows = txns.filter((t) => t.amount < 0);

  for (const out of outflows) {
    for (const inf of inflows) {
      if (out.accountId === inf.accountId) continue; // must be different own accounts
      if (Math.abs(Math.abs(inf.amount) - out.amount) > EPS) continue; // equal magnitude
      if (daysBetween(out.date, inf.date) > 3) continue; // within 3 days
      flagged.add(out.id);
      flagged.add(inf.id);
    }
  }
  return flagged;
}
