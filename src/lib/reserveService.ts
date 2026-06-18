import "server-only";
import { prisma } from "@/lib/prisma";
import { computeReserve, type ReserveSummary } from "@/lib/reserve";
import { DEFAULT_TAX_RATE } from "@/lib/rules";

export type ReserveData = ReserveSummary & {
  ratePct: number;
  marks: { id: string; amount: number; markedAt: Date }[];
};

// Reads source records and computes the reserve on the fly (addendum §3.3).
// Deleting a payment or a mark therefore rolls back the totals automatically.
export async function getReserveData(userId: string): Promise<ReserveData> {
  const [payments, taggedInflows, marks, taxRule] = await Promise.all([
    prisma.manualPayment.findMany({
      // All genuine income events count (incl. KEPT_SEPARATE) — see reconciliation.ts.
      where: { userId, status: { in: ["ACTIVE", "MERGED", "KEPT_SEPARATE"] } },
      select: { taxSetAsideAmount: true },
    }),
    // Our convention: Plaid inflows are negative amounts.
    prisma.transaction.findMany({
      // Tagged NIL inflows, excluding any merged into a manual payment (§4.5 — no double count).
      where: { userId, incomeTag: "NIL_INCOME", amount: { lt: 0 }, reconciledManualPayment: { is: null } },
      select: { amount: true },
    }),
    prisma.reserveMark.findMany({ where: { userId }, orderBy: { markedAt: "desc" } }),
    prisma.rule.findUnique({ where: { userId_type: { userId, type: "TAX_SET_ASIDE" } } }),
  ]);

  const ratePct = taxRule?.value ?? DEFAULT_TAX_RATE;
  const summary = computeReserve(
    payments.map((p) => p.taxSetAsideAmount),
    taggedInflows.map((t) => Math.abs(t.amount)),
    ratePct,
    marks.map((m) => m.amount),
  );

  return { ...summary, ratePct, marks };
}
