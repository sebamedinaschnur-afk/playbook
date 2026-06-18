"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type ReconcileActionState = { ok: boolean; error?: string };

function revalidate() {
  revalidatePath("/money");
  revalidatePath("/home");
  revalidatePath("/alerts");
}

// Merge a manual payment with the matching bank transaction (§4.5). The manual
// entry's tags + set-aside + goal allocations are untouched; the bank line is
// excluded from income so the dollars aren't counted twice. Reversible.
export async function mergeMatch(
  paymentId: string,
  txnId: string,
): Promise<ReconcileActionState> {
  const { userId } = await verifySession();
  const payment = await prisma.manualPayment.findFirst({
    where: { id: paymentId, userId, status: "ACTIVE" },
  });
  const txn = await prisma.transaction.findFirst({ where: { id: txnId, userId } });
  if (!payment || !txn) return { ok: false, error: "That match is no longer available." };
  // The bank line is the source of truth via ManualPayment.reconciledTransactionId
  // (@unique). Refuse if another payment already claimed it.
  const taken = await prisma.manualPayment.findFirst({ where: { reconciledTransactionId: txnId } });
  if (taken) return { ok: false, error: "That deposit is already merged." };

  await prisma.manualPayment.update({
    where: { id: paymentId },
    data: { status: "MERGED", reconciledTransactionId: txnId },
  });
  revalidate();
  return { ok: true };
}

// Keep separate: both records stand (genuine cash that resembles a bank line).
export async function keepSeparate(paymentId: string): Promise<ReconcileActionState> {
  const { userId } = await verifySession();
  await prisma.manualPayment.updateMany({
    where: { id: paymentId, userId, status: "ACTIVE" },
    data: { status: "KEPT_SEPARATE" },
  });
  revalidate();
  return { ok: true };
}

// Undo a merge (split): restore the payment to ACTIVE and return the bank line to
// income. Reserve/goal allocations were never touched by the merge (§6).
export async function undoMerge(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const paymentId = String(formData.get("paymentId") ?? "");
  // Clearing the payment's reconciledTransactionId restores the bank line to
  // income automatically (the back-relation becomes null). Reserve/goal untouched.
  await prisma.manualPayment.updateMany({
    where: { id: paymentId, userId, status: "MERGED" },
    data: { status: "ACTIVE", reconciledTransactionId: null },
  });
  revalidate();
}

// Undo keep-separate: return the payment to ACTIVE so it can match again.
export async function undoKeepSeparate(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const paymentId = String(formData.get("paymentId") ?? "");
  await prisma.manualPayment.updateMany({
    where: { id: paymentId, userId, status: "KEPT_SEPARATE" },
    data: { status: "ACTIVE" },
  });
  revalidate();
}
