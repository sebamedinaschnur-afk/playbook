import "server-only";
import { prisma } from "@/lib/prisma";
import { detectSelfTransfers } from "@/lib/transfers";

// Recomputes isSelfTransfer across the user's recent transactions (addendum §7).
// Run after a sync. Derived on each pass, so it self-corrects.
export async function classifySelfTransfers(userId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const txns = await prisma.transaction.findMany({
    where: { userId, date: { gte: since } },
    select: { id: true, accountId: true, amount: true, date: true },
  });
  if (txns.length === 0) return;

  const flagged = detectSelfTransfers(txns);
  const flaggedIds = [...flagged];
  const clearIds = txns.map((t) => t.id).filter((id) => !flagged.has(id));

  await prisma.$transaction([
    ...(flaggedIds.length
      ? [prisma.transaction.updateMany({ where: { id: { in: flaggedIds } }, data: { isSelfTransfer: true } })]
      : []),
    ...(clearIds.length
      ? [prisma.transaction.updateMany({ where: { id: { in: clearIds } }, data: { isSelfTransfer: false } })]
      : []),
  ]);
}
