import { describe, it, expect } from "vitest";
import { detectSelfTransfers, type TxnForTransfer } from "./transfers";

const D = new Date("2026-06-10");
const plus = (days: number) => new Date(D.getTime() + days * 86_400_000);
const tx = (id: string, accountId: string, amount: number, date: Date): TxnForTransfer => ({
  id,
  accountId,
  amount,
  date,
});

describe("detectSelfTransfers", () => {
  it("flags an equal +/- pair across two own accounts within 3 days", () => {
    const flagged = detectSelfTransfers([
      tx("out", "checking", 200, D), // money out of checking
      tx("in", "savings", -200, plus(2)), // money into savings
    ]);
    expect(flagged.has("out")).toBe(true);
    expect(flagged.has("in")).toBe(true);
  });

  it("does NOT flag transfers within the same account", () => {
    const flagged = detectSelfTransfers([
      tx("out", "checking", 200, D),
      tx("in", "checking", -200, plus(1)),
    ]);
    expect(flagged.size).toBe(0);
  });

  it("does NOT flag unequal amounts", () => {
    const flagged = detectSelfTransfers([
      tx("out", "checking", 200, D),
      tx("in", "savings", -180, plus(1)),
    ]);
    expect(flagged.size).toBe(0);
  });

  it("does NOT flag pairs more than 3 days apart", () => {
    const flagged = detectSelfTransfers([
      tx("out", "checking", 200, D),
      tx("in", "savings", -200, plus(4)),
    ]);
    expect(flagged.size).toBe(0);
  });

  it("does NOT flag an inflow with no matching outflow (real income)", () => {
    const flagged = detectSelfTransfers([
      tx("deposit", "checking", -500, D), // NIL deposit, no counterpart
      tx("coffee", "checking", 5, plus(1)),
    ]);
    expect(flagged.size).toBe(0);
  });
});
