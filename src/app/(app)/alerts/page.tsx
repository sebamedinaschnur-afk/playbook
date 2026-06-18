import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateAlerts } from "@/lib/alertsService";
import { getReserveData } from "@/lib/reserveService";
import { getEffectiveDueDates } from "@/lib/quarterlyTaxService";

const STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SPENDING: { label: "Spending", color: "text-red", bg: "bg-red-bg", border: "border-red/40" },
  TAX_REMINDER: { label: "Taxes", color: "text-brass", bg: "bg-brass-bg", border: "border-brass/40" },
  LARGE_DEPOSIT: { label: "Deposit", color: "text-green", bg: "bg-green-tint", border: "border-green-border" },
  TAG_INCOME: { label: "Tag income", color: "text-blue", bg: "bg-blue-bg", border: "border-blue/40" },
};

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function timeAgo(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Alerts screen (spec §2.5 + addendum). "On your radar" shows the next tax
// checkpoint and reserve status year-round; below it, live system alerts.
export default async function AlertsPage() {
  const user = await getCurrentUser();
  await generateAlerts(user.id);

  const [alerts, reserve, dueDates] = await Promise.all([
    prisma.alert.findMany({
      where: { userId: user.id, dismissedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    getReserveData(user.id),
    getEffectiveDueDates(),
  ]);

  const today = new Date();
  const nextDue = dueDates.find((d) => d >= today) ?? null;
  const daysAway = nextDue
    ? Math.max(0, Math.ceil((nextDue.getTime() - today.getTime()) / 86_400_000))
    : null;

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Alerts</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Heads-up based on your money and your plan.</p>

      {/* On your radar — always-on, forward-looking context */}
      <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        On your radar
      </h2>
      <div className="space-y-3">
        {nextDue ? (
          <div className="rounded-2xl border border-brass/40 bg-brass-bg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-brass">
                Next estimated taxes
              </span>
              <span className="text-[11px] text-faint">
                {daysAway === 0 ? "due today" : `in ${daysAway} day${daysAway === 1 ? "" : "s"}`}
              </span>
            </div>
            <p className="tnum mt-1 text-2xl">
              {/* Stored as UTC-midnight calendar dates — format in UTC so the day doesn't shift. */}
              {nextDue.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
            <p className="mt-1 text-sm text-muted">
              {reserve.target > 0
                ? `Aim to have your ${usd(reserve.target)} reserve ready — you've set aside ${usd(reserve.marked)} so far.`
                : "Log your NIL income so we can size your set-aside before this date."}
            </p>
          </div>
        ) : null}

        {reserve.target > 0 ? (
          <Link href="/money" className="block rounded-2xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-faint">Tax reserve</span>
              <span className="text-xs text-green">{Math.round(reserve.pct)}%</span>
            </div>
            <p className="tnum mt-1 text-lg">
              {usd(reserve.marked)}{" "}
              <span className="text-sm text-muted">set aside of {usd(reserve.target)}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
              <span
                className="block h-full rounded-full bg-brass"
                style={{ width: `${reserve.pct}%` }}
              />
            </div>
          </Link>
        ) : null}
      </div>

      {/* Live alerts */}
      <h2 className="mb-2 mt-7 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Alerts
      </h2>
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-muted">
            Nothing urgent right now. We&apos;ll flag big deposits, over-spending, untagged
            income, and tax deadlines as they come up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const s = STYLES[a.type] ?? STYLES.SPENDING;
            return (
              <div key={a.id} className={`rounded-2xl border ${s.border} ${s.bg} p-4`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] uppercase tracking-wide ${s.color}`}>
                    {s.label}
                  </span>
                  <span className="text-[11px] text-faint">{timeAgo(a.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{a.title}</p>
                <p className="mt-1 text-sm text-muted">{a.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-faint">
        Alerts are informational. Playbook never moves money — applying a set-aside is always
        your call.
      </p>
    </>
  );
}
