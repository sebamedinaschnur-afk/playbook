"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ManualPaymentSchema } from "@/lib/validation";
import { DEFAULT_TAX_RATE } from "@/lib/rules";

export type LogPaymentState =
  | {
      ok?: boolean;
      amount?: number;
      setAside?: number;
      paymentId?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

const round2 = (n: number) => Math.round(n * 100) / 100;

// Logs a manual payment (spec §4.2/§4.3). Counts immediately — no pending state.
// Snapshots the tax set-aside from the user's current rate at log time (§3.1).
export async function logManualPayment(
  _state: LogPaymentState,
  formData: FormData,
): Promise<LogPaymentState> {
  const { userId } = await verifySession();

  const parsed = ManualPaymentSchema.safeParse({
    amount: formData.get("amount"),
    kind: formData.get("kind"),
    method: formData.get("method"),
    payer: formData.get("payer"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { amount, kind, method, payer } = parsed.data;

  const taxRule = await prisma.rule.findUnique({
    where: { userId_type: { userId, type: "TAX_SET_ASIDE" } },
  });
  const rate = taxRule?.value ?? DEFAULT_TAX_RATE;
  const setAside = round2((amount * rate) / 100);

  const payment = await prisma.manualPayment.create({
    data: {
      userId,
      amount: round2(amount),
      kind,
      method,
      payer: payer ?? null,
      occurredOn: new Date(),
      taxSetAsideAmount: setAside,
      status: "ACTIVE",
    },
  });

  revalidatePath("/money");
  revalidatePath("/home");
  revalidatePath("/alerts");
  return { ok: true, amount: payment.amount, setAside, paymentId: payment.id };
}

// Delete a manual payment and fully roll back its effects (decision #9). Because
// reserve target and goal progress are computed on read, removing the row + its
// allocations restores both exactly. If it was merged, deleting the row clears
// reconciledTransactionId, so the bank line returns to its prior (unreconciled) state.
export async function deleteManualPayment(paymentId: string): Promise<{ ok: boolean }> {
  const { userId } = await verifySession();
  await prisma.$transaction([
    prisma.goalAllocation.deleteMany({ where: { userId, sourceManualPaymentId: paymentId } }),
    prisma.manualPayment.deleteMany({ where: { id: paymentId, userId } }),
  ]);
  revalidatePath("/money");
  revalidatePath("/home");
  revalidatePath("/goals");
  revalidatePath("/alerts");
  return { ok: true };
}
