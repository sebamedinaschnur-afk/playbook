import "server-only";
import { prisma } from "@/lib/prisma";
import { rankCandidates, type MatchTxn } from "@/lib/reconciliation";

export type ReconcileMatch = {
  payment: {
    id: string;
    amount: number;
    payer: string | null;
    occurredOn: Date;
    method: string;
    kind: string;
  };
  txn: {
    id: string;
    label: string;
    amount: number; // magnitude (positive) for display
    date: Date;
    accountName: string | null;
    mask: string | null;
  };
  alternatives: { id: string; label: string; amount: number; date: Date }[];
};

// Finds the single highest-confidence unresolved match to surface in the banner
// (§4.4/§5.3). Only ACTIVE manual payments vs. unreconciled, non-self-transfer
// inflows. KEPT_SEPARATE/MERGED payments are excluded, so a pairing never resurfaces.
export async function findBestMatch(userId: string): Promise<ReconcileMatch | null> {
  const [payments, inflows] = await Promise.all([
    prisma.manualPayment.findMany({
      where: { userId, status: "ACTIVE", reconciledTransactionId: null },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        amount: { lt: 0 }, // inflow (our convention: negative = money in)
        isSelfTransfer: false,
        reconciledManualPayment: { is: null }, // not already merged
      },
      include: { account: { select: { name: true, mask: true } } },
    }),
  ]);
  if (payments.length === 0 || inflows.length === 0) return null;

  const candidates: MatchTxn[] = inflows.map((t) => ({
    id: t.id,
    magnitude: Math.abs(t.amount),
    date: t.date,
  }));

  let best: { payment: (typeof payments)[number]; ranked: ReturnType<typeof rankCandidates> } | null =
    null;
  for (const p of payments) {
    const ranked = rankCandidates({ amount: p.amount, occurredOn: p.occurredOn }, candidates);
    if (ranked.length === 0) continue;
    if (!best || ranked[0].score < best.ranked[0].score) best = { payment: p, ranked };
  }
  if (!best) return null;

  const byId = new Map(inflows.map((t) => [t.id, t]));
  const label = (id: string) => {
    const t = byId.get(id)!;
    return t.merchantName ?? t.name;
  };
  const topId = best.ranked[0].txnId;
  const top = byId.get(topId)!;

  return {
    payment: {
      id: best.payment.id,
      amount: best.payment.amount,
      payer: best.payment.payer,
      occurredOn: best.payment.occurredOn,
      method: best.payment.method,
      kind: best.payment.kind,
    },
    txn: {
      id: top.id,
      label: label(top.id),
      amount: Math.abs(top.amount),
      date: top.date,
      accountName: top.account?.name ?? null,
      mask: top.account?.mask ?? null,
    },
    alternatives: best.ranked.slice(1).map((c) => {
      const t = byId.get(c.txnId)!;
      return { id: c.txnId, label: label(c.txnId), amount: Math.abs(t.amount), date: t.date };
    }),
  };
}
