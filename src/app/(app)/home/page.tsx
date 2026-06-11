import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { totalTrackedBalance, monthlySpending } from "@/lib/money";
import { upcomingTaxDueDate } from "@/lib/alerts";
import { monthsUntil, projectedValue, isOnTrack, progressPct } from "@/lib/goals";
import { ROLE_MODELS } from "@/lib/roleModels";
import { COMMUNITY_STATS, COMMUNITY_HEADLINE } from "@/lib/communityStats";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const ACCENT: Record<string, string> = {
  green: "bg-green-tint text-green",
  brass: "bg-brass-bg text-brass",
  blue: "bg-blue-bg text-blue",
  red: "bg-red-bg text-red",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const now = new Date();

  const [accounts, recent, rules, goals] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        // eslint-disable-next-line react-hooks/purity -- per-request window in an async Server Component
        date: { gte: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.rule.findMany({ where: { userId: user.id } }),
    prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const ruleVal = (t: string) => rules.find((r) => r.type === t)?.value ?? 0;
  const taxPct = ruleVal("TAX_SET_ASIDE");
  const threshold = ruleVal("SPENDING_THRESHOLD");
  const estNil = user.estMonthlyNil ?? 0;

  const tracked = totalTrackedBalance(accounts);
  const spend = monthlySpending(
    recent.map((t) => ({ amount: t.amount, date: t.date, isTransfer: t.isTransfer })),
  );
  const taxDue = upcomingTaxDueDate(now);
  const behindGoal = goals.find(
    (g) =>
      !isOnTrack(
        projectedValue(g.currentSaved, g.monthlyContribution, monthsUntil(g.targetDate, now)),
        g.targetAmount,
      ),
  );
  const topGoal = goals[0];

  // "Your next play" — one prioritized action.
  let play: { title: string; body: string; href?: string; cta?: string; link?: boolean };
  if (accounts.length === 0) {
    play = {
      title: "Link your accounts",
      body: "Connect a bank so Playbook can track your money and NIL deposits automatically.",
      link: true,
    };
  } else if (taxDue) {
    play = {
      title: "Get ready for quarterly taxes",
      body: `Estimated taxes are due ${taxDue.toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Aim to have about ${usd((estNil * taxPct) / 100)} set aside.`,
      href: "/alerts",
      cta: "See alerts",
    };
  } else if (behindGoal) {
    play = {
      title: `You're behind on "${behindGoal.title}"`,
      body: `Bump your monthly contribution to stay on track for ${usd(behindGoal.targetAmount)}.`,
      href: "/goals",
      cta: "Adjust goal",
    };
  } else if (threshold > 0 && spend > threshold) {
    play = {
      title: "Spending's over your limit",
      body: `You've spent ${usd(spend)} this month — past your ${usd(threshold)} budget.`,
      href: "/money",
      cta: "Review spending",
    };
  } else {
    play = {
      title: "You're running the play",
      body: "Tax set-aside, savings, and goals are all on track. Keep it up.",
      href: "/goals",
      cta: "See your goals",
    };
  }

  return (
    <>
      <InstallPrompt />

      {/* Hero */}
      {accounts.length > 0 ? (
        <>
          <p className="text-[11px] uppercase tracking-wide text-faint">Tracked balance</p>
          <p className="tnum text-4xl">{usd(tracked)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Stat label="NIL / month" value={usd(estNil)} />
            <Stat label="Tax set-aside" value={`${Math.round(taxPct)}%`} />
            <Stat label="Goals" value={String(goals.length)} />
            <Stat
              label="Next tax date"
              value={taxDue ? taxDue.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              accent={!!taxDue}
            />
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-semibold">
            Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          {user.school ? (
            <p className="mt-1 text-xs text-green">School-sponsored · {user.school.name}</p>
          ) : null}
        </>
      )}

      {/* Your next play */}
      <div className="mt-5 rounded-2xl border border-green-border bg-green-tint p-4">
        <p className="text-[11px] uppercase tracking-wide text-green">Your next play</p>
        <p className="mt-1 text-sm font-medium">{play.title}</p>
        <p className="mt-1 text-sm text-muted">{play.body}</p>
        {play.link ? (
          <PlaidLinkButton className="mt-3 rounded-lg bg-green px-3.5 py-2 text-sm font-semibold text-[#08251a] disabled:opacity-50">
            Connect a bank
          </PlaidLinkButton>
        ) : play.href ? (
          <Link
            href={play.href}
            className="mt-3 inline-block rounded-lg border border-green-border px-3.5 py-2 text-sm font-semibold text-green"
          >
            {play.cta}
          </Link>
        ) : null}
      </div>

      {/* Goal momentum */}
      {topGoal ? (
        <Link href="/goals" className="mt-3 block rounded-2xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-faint">Top goal</p>
            <span className="text-xs text-green">{Math.round(progressPct(topGoal.currentSaved, topGoal.targetAmount))}%</span>
          </div>
          <p className="mt-1 text-sm font-medium">{topGoal.title}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
            <span
              className="block h-full rounded-full bg-green"
              style={{ width: `${progressPct(topGoal.currentSaved, topGoal.targetAmount)}%` }}
            />
          </div>
        </Link>
      ) : null}

      {/* Athletes who made the play (role models → future marketplace) */}
      <h2 className="mb-2 mt-7 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Built beyond the game
      </h2>
      <div className="space-y-2.5">
        {ROLE_MODELS.map((m) => {
          const inner = (
            <>
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-sm font-semibold ${ACCENT[m.accent]}`}
                >
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-faint">
                    {m.past} → {m.now}
                  </p>
                </div>
                {m.sourceUrl ? <span className="flex-none text-faint">↗</span> : null}
              </div>
              <p className="mt-2.5 text-sm leading-snug text-muted">{m.fact}</p>
              {m.source ? (
                <p className="mt-2 text-xs text-green">
                  {m.sourceUrl ? `Read on ${m.source} →` : `Source: ${m.source}`}
                </p>
              ) : null}
            </>
          );

          return m.sourceUrl ? (
            <a
              key={m.initials}
              href={m.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-line bg-panel p-4 transition active:scale-[.99]"
            >
              {inner}
            </a>
          ) : (
            <div key={m.initials} className="rounded-2xl border border-line bg-panel p-4">
              {inner}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Compiled from public reporting. Playbook isn&apos;t affiliated with these athletes —
        shared for inspiration, not financial advice. (Vetted mentors you can actually talk to
        arrive with Playbook Pros.)
      </p>

      {/* Athletes like you (community benchmarks) */}
      <div className="mt-6 rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Athletes like you
        </h2>
        <p className="mt-2 text-sm">{COMMUNITY_HEADLINE}</p>
        <div className="mt-3 space-y-2">
          {COMMUNITY_STATS.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2.5">
              <span className="tnum w-16 flex-none text-lg text-green">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-faint">
          You&apos;re building something most athletes never do. You&apos;re in good company.
        </p>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`tnum mt-0.5 text-lg ${accent ? "text-brass" : ""}`}>{value}</p>
    </div>
  );
}
