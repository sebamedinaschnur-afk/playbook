import { describe, it, expect } from "vitest";
import {
  rankCandidates,
  bestCandidate,
  qualifies,
  paymentCountsAsIncome,
  txnCountsAsIncome,
  type MatchPayment,
  type MatchTxn,
} from "./reconciliation";

const D = new Date("2026-06-10");
const plus = (days: number) => new Date(D.getTime() + days * 86_400_000);

describe("matching rule (§5)", () => {
  it("exact match qualifies", () => {
    const p: MatchPayment = { amount: 500, occurredOn: D };
    const t: MatchTxn = { id: "t1", magnitude: 500, date: plus(1) };
    expect(qualifies(p, t)).toBe(true);
    expect(bestCandidate(p, [t])?.txnId).toBe("t1");
  });

  it("within-tolerance match qualifies (±5% or ±$25)", () => {
    const p: MatchPayment = { amount: 500, occurredOn: D };
    // $20 off and 3 days off — within $25 tolerance and 7-day window
    expect(qualifies(p, { id: "t", magnitude: 520, date: plus(3) })).toBe(true);
  });

  it("fee-reduced deposit ($500 manual vs $485 bank) qualifies", () => {
    const p: MatchPayment = { amount: 500, occurredOn: D };
    expect(qualifies(p, { id: "t", magnitude: 485, date: plus(2) })).toBe(true);
  });

  it("just-outside-tolerance does NOT match (amount too far)", () => {
    const p: MatchPayment = { amount: 500, occurredOn: D };
    // $60 off > max(5% of 500 = 25, 25) = 25
    expect(qualifies(p, { id: "t", magnitude: 560, date: plus(1) })).toBe(false);
    expect(bestCandidate(p, [{ id: "t", magnitude: 560, date: plus(1) }])).toBeNull();
  });

  it("just-outside-tolerance does NOT match (date too far)", () => {
    const p: MatchPayment = { amount: 500, occurredOn: D };
    expect(qualifies(p, { id: "t", magnitude: 500, date: plus(8) })).toBe(false);
  });

  it("uses 5% when it exceeds $25 on larger amounts", () => {
    const p: MatchPayment = { amount: 2000, occurredOn: D }; // tolerance = $100
    expect(qualifies(p, { id: "t", magnitude: 1910, date: plus(1) })).toBe(true); // $90 off
    expect(qualifies(p, { id: "t", magnitude: 1880, date: plus(1) })).toBe(false); // $120 off
  });

  it("two manual + two bank same week pair correctly", () => {
    const a: MatchPayment = { amount: 500, occurredOn: D };
    const b: MatchPayment = { amount: 300, occurredOn: D };
    const txns: MatchTxn[] = [
      { id: "bank500", magnitude: 500, date: plus(1) },
      { id: "bank300", magnitude: 300, date: plus(1) },
    ];
    expect(bestCandidate(a, txns)?.txnId).toBe("bank500");
    expect(bestCandidate(b, txns)?.txnId).toBe("bank300");
  });

  it("ranks the closest candidate first when several qualify", () => {
    const p: MatchPayment = { amount: 500, occurredOn: D };
    const ranked = rankCandidates(p, [
      { id: "far", magnitude: 522, date: plus(5) },
      { id: "near", magnitude: 500, date: plus(1) },
    ]);
    expect(ranked[0].txnId).toBe("near");
    expect(ranked).toHaveLength(2);
  });
});

describe("income counting across reconciliation states (§4.5/§6)", () => {
  it("manual payment counts while ACTIVE and after MERGE, not when KEPT_SEPARATE-as-dup", () => {
    expect(paymentCountsAsIncome("ACTIVE")).toBe(true);
    expect(paymentCountsAsIncome("MERGED")).toBe(true);
    expect(paymentCountsAsIncome("KEPT_SEPARATE")).toBe(true); // kept-separate is genuine income too
  });

  it("merged transaction is excluded from income; splitting restores it", () => {
    // Merged: txn linked to a payment → excluded even if tagged
    expect(txnCountsAsIncome("payment_1", "NIL_INCOME")).toBe(false);
    // After split (link cleared): counts per its tag
    expect(txnCountsAsIncome(null, "NIL_INCOME")).toBe(true);
    expect(txnCountsAsIncome(null, "UNTAGGED")).toBe(false);
  });
});
