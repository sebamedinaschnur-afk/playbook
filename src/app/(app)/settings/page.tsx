import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui";
import { SettingsForm, type RuleField } from "./SettingsForm";
import {
  explainTaxSetAside,
  explainMonthlySavings,
  explainSpendingThreshold,
} from "@/lib/rules";

// Settings: edit the three starting rules, each with a plain-English "why" (spec §2.4).
export default async function SettingsPage() {
  const user = await getCurrentUser();
  const rules = await prisma.rule.findMany({ where: { userId: user.id } });

  const byType = (t: string) => rules.find((r) => r.type === t);
  const nil = user.estMonthlyNil ?? 0;
  const horizon = user.careerHorizonYears ?? 4;

  const tax = byType("TAX_SET_ASIDE")?.value ?? 30;
  const savings = byType("MONTHLY_SAVINGS")?.value ?? 0;
  const threshold = byType("SPENDING_THRESHOLD")?.value ?? 1500;

  const fields: RuleField[] = [
    {
      name: "taxSetAsidePct",
      label: "Tax set-aside",
      suffix: "% of every payment",
      value: tax,
      why: byType("TAX_SET_ASIDE")?.explanation ?? explainTaxSetAside(tax, nil),
    },
    {
      name: "monthlySavings",
      label: "Monthly savings target",
      prefix: "$",
      suffix: "/month",
      value: savings,
      why: byType("MONTHLY_SAVINGS")?.explanation ?? explainMonthlySavings(savings, nil, horizon),
    },
    {
      name: "spendingThreshold",
      label: "Spending alert threshold",
      prefix: "$",
      suffix: "/month",
      value: threshold,
      why: byType("SPENDING_THRESHOLD")?.explanation ?? explainSpendingThreshold(threshold, nil),
    },
  ];

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Settings</h1>
      <p className="mt-1 mb-5 text-sm text-muted">
        Your rules, your call. Edit any value — the reasoning updates with it.
      </p>

      <SettingsForm fields={fields} />

      <form action={logout} className="mt-8">
        <Button variant="ghost" type="submit">
          Log out
        </Button>
      </form>

      <p className="mt-6 text-[11px] leading-relaxed text-faint">
        These rules are educational starting points, not licensed financial advice.
      </p>
    </>
  );
}
