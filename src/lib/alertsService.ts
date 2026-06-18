import "server-only";
import { prisma } from "@/lib/prisma";
import { computeAlerts } from "@/lib/alerts";
import { monthlySpending } from "@/lib/money";
import { getEffectiveDueDates } from "@/lib/quarterlyTaxService";

// Computes alerts for a user and upserts them (deduped). Called on refresh and
// when the Alerts screen loads (spec §2.5: computed on login/refresh).
export async function generateAlerts(userId: string): Promise<void> {
  const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const [user, rules, recent, taxDueDates] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.rule.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "desc" },
    }),
    getEffectiveDueDates(),
  ]);
  if (!user) return;

  const ruleValue = (type: string) => rules.find((r) => r.type === type)?.value ?? 0;
  const spending = monthlySpending(
    recent.map((t) => ({
      amount: t.amount,
      date: t.date,
      isTransfer: t.isTransfer,
      isSelfTransfer: t.isSelfTransfer,
    })),
  );

  const descriptors = computeAlerts({
    now: new Date(),
    monthlySpending: spending,
    spendingThreshold: ruleValue("SPENDING_THRESHOLD"),
    taxSetAsidePct: ruleValue("TAX_SET_ASIDE"),
    estMonthlyNil: user.estMonthlyNil ?? 0,
    taxDueDates: taxDueDates.length > 0 ? taxDueDates : undefined,
    recentTransactions: recent.map((t) => ({
      plaidTransactionId: t.plaidTransactionId,
      amount: t.amount,
      date: t.date,
      isTransfer: t.isTransfer,
      name: t.name,
      merchantName: t.merchantName,
      incomeTag: t.incomeTag,
      isSelfTransfer: t.isSelfTransfer,
    })),
  });

  for (const d of descriptors) {
    await prisma.alert.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey: d.dedupeKey } },
      update: { title: d.title, body: d.body },
      create: { userId, type: d.type, title: d.title, body: d.body, dedupeKey: d.dedupeKey },
    });
  }
}
