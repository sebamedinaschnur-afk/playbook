import { describe, it, expect } from "vitest";
import {
  computeAlerts,
  upcomingTaxDueDate,
  type AlertTransaction,
  type ComputeAlertsInput,
} from "./alerts";

const base: ComputeAlertsInput = {
  now: new Date("2026-07-20T12:00:00"), // not near a tax due date
  monthlySpending: 500,
  spendingThreshold: 2000,
  taxSetAsidePct: 30,
  estMonthlyNil: 4000,
  recentTransactions: [],
};

const deposit = (id: string, amount: number, isTransfer = false): AlertTransaction => ({
  plaidTransactionId: id,
  amount,
  date: new Date("2026-07-15"),
  isTransfer,
  name: "Gatorbite Energy",
  merchantName: "Gatorbite",
});

describe("spending alert", () => {
  it("fires only when spending exceeds the threshold", () => {
    expect(computeAlerts({ ...base, monthlySpending: 2500 }).some((a) => a.type === "SPENDING")).toBe(true);
    expect(computeAlerts({ ...base, monthlySpending: 1500 }).some((a) => a.type === "SPENDING")).toBe(false);
  });

  it("dedupes per calendar month", () => {
    const a = computeAlerts({ ...base, monthlySpending: 2500 }).find((x) => x.type === "SPENDING");
    expect(a?.dedupeKey).toBe("SPENDING-2026-07");
  });
});

describe("quarterly tax reminder", () => {
  it("returns the due date when within 30 days", () => {
    expect(upcomingTaxDueDate(new Date("2026-06-10"))).toEqual(new Date(2026, 5, 15)); // before Jun 15
    expect(upcomingTaxDueDate(new Date("2026-09-01"))).toEqual(new Date(2026, 8, 15)); // before Sep 15
    expect(upcomingTaxDueDate(new Date("2025-12-20"))).toEqual(new Date(2026, 0, 15)); // December window
  });

  it("returns null when not near a due date", () => {
    expect(upcomingTaxDueDate(new Date("2026-07-20"))).toBeNull();
  });

  it("includes the tax set-aside target in the alert", () => {
    const a = computeAlerts({ ...base, now: new Date("2026-06-10") }).find((x) => x.type === "TAX_REMINDER");
    expect(a).toBeDefined();
    expect(a?.body).toContain("30%");
    expect(a?.body).toContain("$1,200"); // 30% of 4000
  });
});

describe("large deposit", () => {
  it("fires for inflows >= $1,000 that aren't transfers", () => {
    const alerts = computeAlerts({ ...base, recentTransactions: [deposit("t1", -1500)] });
    const a = alerts.find((x) => x.type === "LARGE_DEPOSIT");
    expect(a).toBeDefined();
    expect(a?.body).toContain("$1,500");
    expect(a?.body).toContain("$450"); // 30% set-aside
    expect(a?.dedupeKey).toBe("DEPOSIT-t1");
  });

  it("ignores small deposits, outflows, and transfers", () => {
    const alerts = computeAlerts({
      ...base,
      recentTransactions: [
        deposit("small", -500),
        deposit("outflow", 5000),
        deposit("transfer", -3000, true),
      ],
    });
    expect(alerts.some((a) => a.type === "LARGE_DEPOSIT")).toBe(false);
  });
});
