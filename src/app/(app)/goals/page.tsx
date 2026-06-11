import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ProjectionWidget } from "@/components/ProjectionWidget";
import { AddGoal } from "./AddGoal";
import { deleteGoal } from "@/app/actions/goals";
import { templateFor } from "@/lib/goalTemplates";
import {
  monthsUntil,
  requiredMonthlyContribution,
  projectedValue,
  progressPct,
  isOnTrack,
  runwayMonths,
} from "@/lib/goals";
import { totalTrackedBalance, monthlySpending } from "@/lib/money";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// "Next Season" — life-after-sport goals, the runway view, and the projection.
export default async function GoalsPage() {
  const user = await getCurrentUser();
  const years = user.careerHorizonYears ?? 4;

  const [goals, accounts, recent, rules] = await Promise.all([
    prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        // eslint-disable-next-line react-hooks/purity -- per-request window in an async Server Component
        date: { gte: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.rule.findMany({ where: { userId: user.id } }),
  ]);

  const savingsTarget = rules.find((r) => r.type === "MONTHLY_SAVINGS")?.value ?? 500;
  const spendThreshold = rules.find((r) => r.type === "SPENDING_THRESHOLD")?.value ?? 0;

  const tracked = totalTrackedBalance(accounts);
  const spend = monthlySpending(recent.map((t) => ({ amount: t.amount, date: t.date, isTransfer: t.isTransfer })));
  // Burn = the bigger of actual recent spending and their planned monthly budget,
  // so the runway reflects a realistic lifestyle (sandbox spending is artificially low).
  const monthlyBurn = Math.max(spend, spendThreshold);
  const runway = runwayMonths(tracked, monthlyBurn);
  const runwayLabel =
    runway === null ? "" : runway >= 24 ? `${(runway / 12).toFixed(1)} years` : `${runway} months`;

  const now = new Date();

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Next Season</h1>
      <p className="mt-1 mb-4 text-sm text-muted">
        Your money has a job after sport too. Set the goals, and we&apos;ll plan the steps.
      </p>

      {/* Career runway — the honest after-the-game view */}
      <div className="mb-5 rounded-2xl border border-brass/40 bg-brass-bg p-4">
        <p className="text-[11px] uppercase tracking-wide text-brass">Your earning window</p>
        <p className="tnum mt-1 text-2xl">
          ~{years} year{years === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {runway !== null
            ? `If your sport income stopped today, your ${usd(tracked)} in tracked savings would cover about ${runwayLabel} at a ${usd(monthlyBurn)}/mo budget. The goals below are how you build past that.`
            : "Link a bank so we can show how long your savings would last after sport — and plan past it."}
        </p>
      </div>

      {/* Goals */}
      <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Your goals
      </h2>
      <div className="space-y-3">
        {goals.map((g) => {
          const tpl = templateFor(g.category);
          const months = monthsUntil(g.targetDate, now);
          const required = requiredMonthlyContribution(g.targetAmount, g.currentSaved, months);
          const projected = projectedValue(g.currentSaved, g.monthlyContribution, months);
          const pct = progressPct(g.currentSaved, g.targetAmount);
          const onTrack = isOnTrack(projected, g.targetAmount);

          return (
            <div key={g.id} className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">{tpl.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{g.title}</p>
                  <p className="text-xs text-faint">
                    {usd(g.targetAmount)} by{" "}
                    {g.targetDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <span
                  className={`flex-none rounded-full px-2 py-0.5 text-[11px] ${
                    onTrack ? "bg-green-tint text-green" : "bg-red-bg text-red"
                  }`}
                >
                  {onTrack ? "On track" : "Behind"}
                </span>
              </div>

              {/* Progress */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
                <span
                  className="block h-full rounded-full bg-green"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {usd(g.currentSaved)} saved · {Math.round(pct)}% there ·{" "}
                <span className="text-faint">
                  {usd(g.monthlyContribution)}/mo set · ~{usd(required)}/mo to finish on time
                </span>
              </p>
              <p className="mt-1 text-xs text-faint">
                Projected at this pace: <span className="text-ink">{usd(projected)}</span>
              </p>

              {/* Steps */}
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {tpl.steps.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs text-muted">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-brass" />
                    {s}
                  </li>
                ))}
              </ul>

              <form action={deleteGoal} className="mt-3">
                <input type="hidden" name="id" value={g.id} />
                <button type="submit" className="text-xs text-faint">
                  Remove goal
                </button>
              </form>
            </div>
          );
        })}

        <AddGoal />
      </div>

      {/* Projection (the former Timeline) */}
      <h2 className="mb-2 mt-7 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        How your saving grows
      </h2>
      <ProjectionWidget years={years} initialMonthly={Math.round(savingsTarget)} />

      <p className="mt-6 text-[11px] leading-relaxed text-faint">
        Goal projections are illustrative, not financial advice. Steps that need a licensed
        pro are flagged — pro intros are coming soon.
      </p>
    </>
  );
}
