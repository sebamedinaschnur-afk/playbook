import { describe, it, expect } from "vitest";
import {
  totalTrackedBalance,
  allocation,
  monthlySpending,
  type AccountLike,
  type TransactionLike,
} from "./money";

const accounts: AccountLike[] = [
  { id: "a", name: "Checking", institutionName: "Bank", type: "depository", currentBalance: 1000 },
  { id: "b", name: "Brokerage", institutionName: "Bank", type: "investment", currentBalance: 3000 },
  { id: "c", name: "Credit Card", institutionName: "Bank", type: "credit", currentBalance: 500 },
];

describe("totalTrackedBalance", () => {
  it("sums asset accounts only (excludes credit/loan liabilities)", () => {
    expect(totalTrackedBalance(accounts)).toBe(4000);
  });

  it("treats missing balances as 0", () => {
    expect(totalTrackedBalance([{ id: "x", name: "n", institutionName: null, type: "depository", currentBalance: null }])).toBe(0);
  });
});

describe("allocation", () => {
  it("computes percentages of total assets, sorted by balance desc", () => {
    const alloc = allocation(accounts);
    expect(alloc.map((a) => a.id)).toEqual(["b", "a"]); // 3000 before 1000, credit excluded
    expect(alloc[0].pct).toBeCloseTo(75);
    expect(alloc[1].pct).toBeCloseTo(25);
  });
});

describe("monthlySpending", () => {
  const now = new Date("2026-06-15T12:00:00");
  const tx = (amount: number, date: string, isTransfer = false): TransactionLike => ({
    amount,
    date: new Date(date),
    isTransfer,
  });

  it("sums current-month outflows, excluding transfers and inflows", () => {
    const txns = [
      tx(50, "2026-06-02"), // counted
      tx(20, "2026-06-10"), // counted
      tx(-4000, "2026-06-05"), // inflow (deposit) — excluded
      tx(900, "2026-06-07", true), // transfer — excluded
      tx(100, "2026-05-30"), // last month — excluded
    ];
    expect(monthlySpending(txns, now)).toBe(70);
  });

  it("is 0 with no qualifying transactions", () => {
    expect(monthlySpending([tx(-100, "2026-06-01")], now)).toBe(0);
  });
});
