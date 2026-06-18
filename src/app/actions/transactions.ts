"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { generateAlerts } from "@/lib/alertsService";

// Tag a Plaid inflow's income status (addendum §7). Tagging NIL_INCOME adds it to
// the reserve target (computed on read); NOT_INCOME excludes it. Moves no money.
export async function tagInflow(
  txnId: string,
  tag: "NIL_INCOME" | "NOT_INCOME" | "UNTAGGED",
): Promise<{ ok: boolean }> {
  const { userId } = await verifySession();
  await prisma.transaction.updateMany({
    where: { id: txnId, userId },
    data: { incomeTag: tag },
  });
  // Clear the "tag it" prompt for this inflow now that it's resolved.
  await prisma.alert.deleteMany({ where: { userId, dedupeKey: `TAG-${txnId}` } });
  await generateAlerts(userId);
  revalidatePath("/money");
  revalidatePath("/alerts");
  return { ok: true };
}
