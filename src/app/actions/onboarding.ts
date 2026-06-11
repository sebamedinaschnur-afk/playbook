"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { OnboardingSchema, type OnboardingInput } from "@/lib/validation";
import { generateRules } from "@/lib/rules";

export type OnboardingResult = { ok: false; errors: Record<string, string[]> };

// Persists onboarding answers and generates the three starting rules (spec §2.1, §2.4).
// On success it redirects to /home (so the return type only carries the error case).
export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult | void> {
  const { userId } = await verifySession();

  const parsed = OnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const rules = generateRules(data.estMonthlyNil, data.careerHorizonYears);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        sport: data.sport,
        year: data.year,
        careerHorizonYears: data.careerHorizonYears,
        hasNilDeals: data.hasNilDeals,
        estMonthlyNil: data.estMonthlyNil,
        paymentChannels: data.paymentChannels,
        onboardingComplete: true,
      },
    }),
    // Replace any existing rules with the freshly generated set.
    prisma.rule.deleteMany({ where: { userId } }),
    prisma.rule.create({
      data: {
        userId,
        type: "TAX_SET_ASIDE",
        value: rules.taxSetAsidePct,
        unit: "PERCENT",
        explanation: rules.explanations.taxSetAside,
      },
    }),
    prisma.rule.create({
      data: {
        userId,
        type: "MONTHLY_SAVINGS",
        value: rules.monthlySavings,
        unit: "DOLLARS",
        explanation: rules.explanations.monthlySavings,
      },
    }),
    prisma.rule.create({
      data: {
        userId,
        type: "SPENDING_THRESHOLD",
        value: rules.spendingThreshold,
        unit: "DOLLARS",
        explanation: rules.explanations.spendingThreshold,
      },
    }),
  ]);

  redirect("/home");
}
