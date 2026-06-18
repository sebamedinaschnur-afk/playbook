"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type ReserveMarkState = { ok?: boolean; error?: string } | undefined;

const round2 = (n: number) => Math.round(n * 100) / 100;
const AmountSchema = z.coerce.number().positive().max(10_000_000);

// Self-report that the user moved $X into their tax reserve. Moves no money.
export async function addReserveMark(
  _state: ReserveMarkState,
  formData: FormData,
): Promise<ReserveMarkState> {
  const { userId } = await verifySession();
  const parsed = AmountSchema.safeParse(formData.get("amount"));
  if (!parsed.success) {
    return { ok: false, error: "Enter an amount greater than $0." };
  }
  await prisma.reserveMark.create({
    data: { userId, amount: round2(parsed.data) },
  });
  revalidatePath("/money");
  return { ok: true };
}

export async function removeReserveMark(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  // Scoped to the owner; recomputing the reserve on read rolls back the total.
  await prisma.reserveMark.deleteMany({ where: { id, userId } });
  revalidatePath("/money");
}
