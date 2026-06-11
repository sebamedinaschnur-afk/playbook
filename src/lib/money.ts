// Pure helpers for the Money view (spec §2.3). Kept free of DB/Next imports so the
// financial math is unit-testable.

export type AccountLike = {
  id: string;
  name: string;
  institutionName: string | null;
  type: string | null;
  currentBalance: number | null;
};

export type TransactionLike = {
  amount: number; // Plaid convention: positive = money out of the account
  date: Date;
  isTransfer: boolean;
};

export type Allocation = {
  id: string;
  name: string;
  institutionName: string | null;
  balance: number;
  pct: number;
};

// "Where your money lives" = asset accounts. Liabilities (credit/loan) are excluded
// from the tracked-balance hero and allocation so the number isn't distorted.
const ASSET_TYPES = new Set(["depository", "investment"]);

export function isAsset(a: AccountLike): boolean {
  return ASSET_TYPES.has((a.type ?? "").toLowerCase());
}

export function assetAccounts(accounts: AccountLike[]): AccountLike[] {
  return accounts.filter(isAsset);
}

export function totalTrackedBalance(accounts: AccountLike[]): number {
  return assetAccounts(accounts).reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
}

export function allocation(accounts: AccountLike[]): Allocation[] {
  const assets = assetAccounts(accounts);
  const total = assets.reduce((s, a) => s + (a.currentBalance ?? 0), 0);
  return assets
    .map((a) => {
      const balance = a.currentBalance ?? 0;
      return {
        id: a.id,
        name: a.name,
        institutionName: a.institutionName,
        balance,
        pct: total > 0 ? (balance / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.balance - a.balance);
}

export function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Current-month spending: outflows (amount > 0) excluding transfers between the
// user's own accounts (spec §2.3).
export function monthlySpending(
  transactions: TransactionLike[],
  now: Date = new Date(),
): number {
  const start = startOfMonth(now);
  return transactions
    .filter((t) => !t.isTransfer && t.amount > 0 && t.date >= start)
    .reduce((sum, t) => sum + t.amount, 0);
}
