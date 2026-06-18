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

const deposit = (
  id: string,
  amount: number,
  opts: { isTransfer?: boolean; incomeTag?: "UNTAGGED" | "NIL_INCOME" | "NOT_INCOME"; isSelfTransfer?: boolean } = {},
): AlertTransaction => ({
  plaidTransactionId: id,
  amount,
  date: new Date("2026-07-15"),
  isTransfer: opts.isTransfer ?? false,
  name: "Gatorbite Energy",
  merchantName: "Gatorbite",
  incomeTag: opts.incomeTag,
  isSelfTransfer: opts.isSelfTransfer,
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

describe("large inflow alerts (tag-aware, §7)", () => {
  it("prompts to tag an UNTAGGED inflow >= $1,000", () => {
    const alerts = computeAlerts({ ...base, recentTransactions: [deposit("t1", -1500)] });
    const a = alerts.find((x) => x.type === "TAG_INCOME");
    expect(a).toBeDefined();
    expect(a?.body).toContain("$1,500");
    expect(a?.dedupeKey).toBe("TAG-t1");
    expect(alerts.some((x) => x.type === "LARGE_DEPOSIT")).toBe(false);
  });

  it("nudges set-aside on a NIL_INCOME-tagged inflow >= $1,000", () => {
    const alerts = computeAlerts({
      ...base,
      recentTransactions: [deposit("t2", -1500, { incomeTag: "NIL_INCOME" })],
    });
    const a = alerts.find((x) => x.type === "LARGE_DEPOSIT");
    expect(a).toBeDefined();
    expect(a?.body).toContain("$450"); // 30% of 1500
    expect(a?.dedupeKey).toBe("DEPOSIT-t2");
    expect(alerts.some((x) => x.type === "TAG_INCOME")).toBe(false);
  });

  it("ignores NOT_INCOME inflows, small ones, outflows, transfers, and self-transfers", () => {
    const alerts = computeAlerts({
      ...base,
      recentTransactions: [
        deposit("notincome", -3000, { incomeTag: "NOT_INCOME" }),
        deposit("small", -500),
        deposit("outflow", 5000),
        deposit("transfer", -3000, { isTransfer: true }),
        deposit("selfxfer", -3000, { isSelfTransfer: true }),
      ],
    });
    expect(alerts.some((a) => a.type === "TAG_INCOME" || a.type === "LARGE_DEPOSIT")).toBe(false);
  });
});
