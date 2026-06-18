"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type AllocationState = { ok?: boolean; error?: string } | undefined;

const round2 = (n: number) => Math.round(n * 100) / 100;

function revalidate() {
  revalidatePath("/goals");
  revalidatePath("/home");
  revalidatePath("/money");
}

// Assign part of a logged manual payment to a goal (addendum §4.3, Step B "Done").
export async function assignGoalAllocation(
  paymentId: string,
  goalId: string,
  amount: number,
): Promise<AllocationState> {
  const { userId } = await verifySession();
  if (!(amount > 0)) return { ok: false, error: "Amount must be greater than $0." };

  const payment = await prisma.manualPayment.findFirst({ where: { id: paymentId, userId } });
  if (!payment) return { ok: false, error: "Payment not found." };
  // Can't assign more than the payment was worth.
  if (round2(amount) > round2(payment.amount) + 0.001) {
    return { ok: false, error: "Can't assign more than the payment amount." };
  }
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return { ok: false, error: "Goal not found." };

  await prisma.goalAllocation.create({
    data: {
      userId,
      goalId,
      amount: round2(amount),
      sourceType: "MANUAL_PAYMENT",
      sourceManualPaymentId: paymentId,
    },
  });
  revalidate();
  return { ok: true };
}

// Ad-hoc "add to goal" from the Goals screen (sourceType MANUAL_ADHOC).
export async function addAdhocAllocation(
  _state: AllocationState,
  formData: FormData,
): Promise<AllocationState> {
  const { userId } = await verifySession();
  const goalId = String(formData.get("goalId") ?? "");
  const amount = Number(formData.get("amount"));
  if (!(amount > 0)) return { ok: false, error: "Enter an amount greater than $0." };

  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return { ok: false, error: "Goal not found." };

  await prisma.goalAllocation.create({
    data: { userId, goalId, amount: round2(amount), sourceType: "MANUAL_ADHOC" },
  });
  revalidate();
  return { ok: true };
}

// Reversibility: remove an allocation; goal progress recomputes on read.
export async function removeAllocation(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  await prisma.goalAllocation.deleteMany({ where: { id, userId } });
  revalidate();
}
