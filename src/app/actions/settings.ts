"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { RulesUpdateSchema } from "@/lib/validation";
import {
  explainTaxSetAside,
  explainMonthlySavings,
  explainSpendingThreshold,
} from "@/lib/rules";

export type SettingsState =
  | { ok?: boolean; message?: string; errors?: Record<string, string[]> }
  | undefined;

// Edit the three generated rules (spec §2.4). Re-derives each rule's
// plain-English "why" from the new value + the user's NIL/horizon answers.
export async function updateRules(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { userId } = await verifySession();

  const parsed = RulesUpdateSchema.safeParse({
    taxSetAsidePct: formData.get("taxSetAsidePct"),
    monthlySavings: formData.get("monthlySavings"),
    spendingThreshold: formData.get("spendingThreshold"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { taxSetAsidePct, monthlySavings, spendingThreshold } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const nil = user?.estMonthlyNil ?? 0;
  const horizon = user?.careerHorizonYears ?? 4;

  await prisma.$transaction([
    prisma.rule.update({
      where: { userId_type: { userId, type: "TAX_SET_ASIDE" } },
      data: {
        value: taxSetAsidePct,
        explanation: explainTaxSetAside(taxSetAsidePct, nil),
      },
    }),
    prisma.rule.update({
      where: { userId_type: { userId, type: "MONTHLY_SAVINGS" } },
      data: {
        value: monthlySavings,
        explanation: explainMonthlySavings(monthlySavings, nil, horizon),
      },
    }),
    prisma.rule.update({
      where: { userId_type: { userId, type: "SPENDING_THRESHOLD" } },
      data: {
        value: spendingThreshold,
        explanation: explainSpendingThreshold(spendingThreshold, nil),
      },
    }),
  ]);

  revalidatePath("/settings");
  return { ok: true, message: "Your rules are updated." };
}
