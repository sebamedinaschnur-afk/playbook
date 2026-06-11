import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateAlerts } from "@/lib/alertsService";

const STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SPENDING: { label: "Spending", color: "text-red", bg: "bg-red-bg", border: "border-red/40" },
  TAX_REMINDER: { label: "Taxes", color: "text-brass", bg: "bg-brass-bg", border: "border-brass/40" },
  LARGE_DEPOSIT: { label: "Deposit", color: "text-green", bg: "bg-green-tint", border: "border-green-border" },
};

function timeAgo(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Alerts screen (spec §2.5). Recomputes on load, then lists system-generated alerts.
export default async function AlertsPage() {
  const user = await getCurrentUser();
  await generateAlerts(user.id);

  const alerts = await prisma.alert.findMany({
    where: { userId: user.id, dismissedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Alerts</h1>
      <p className="mt-1 mb-5 text-sm text-muted">
        Heads-up based on your money and your plan.
      </p>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-muted">
            You&apos;re all clear — no alerts right now. We&apos;ll flag big deposits,
            over-spending, and tax deadlines as they come up.
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
        Alerts are informational. Playbook never moves money — applying a set-aside is
        always your call.
      </p>
    </>
  );
}
