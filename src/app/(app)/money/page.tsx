import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { RefreshControl } from "@/components/RefreshControl";
import { totalTrackedBalance, allocation, monthlySpending } from "@/lib/money";

const BAR_COLORS = ["#3DBE8B", "#2C7B5E", "#C9A24B", "#5FA8E0", "#5F6E7A"];

function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function usd2(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}
function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Money view (spec §2.3): tracked balance, allocation, recent transactions, monthly spend.
export default async function MoneyPage() {
  const user = await getCurrentUser();

  const [accounts, recent] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        // eslint-disable-next-line react-hooks/purity -- per-request "now" in an async Server Component
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: "desc" },
      include: { account: { select: { name: true, mask: true } } },
    }),
  ]);

  // Empty state — no linked accounts yet.
  if (accounts.length === 0) {
    return (
      <>
        <h1 className="font-display text-xl font-semibold">Money</h1>
        <div className="mt-5 rounded-2xl border border-green-border bg-green-tint p-4">
          <p className="text-sm font-medium text-green">Link a bank to get started</p>
          <p className="mt-1 text-sm text-muted">
            Once linked, your balances and transactions show up here automatically.
          </p>
          <PlaidLinkButton className="mt-3 rounded-lg bg-green px-3.5 py-2 text-sm font-semibold text-[#08251a] disabled:opacity-50">
            Connect a bank
          </PlaidLinkButton>
        </div>
      </>
    );
  }

  const total = totalTrackedBalance(accounts);
  const alloc = allocation(accounts);
  const spending = monthlySpending(
    recent.map((t) => ({ amount: t.amount, date: t.date, isTransfer: t.isTransfer })),
  );

  // Group recent transactions by day.
  const groups = new Map<string, typeof recent>();
  for (const t of recent) {
    const key = t.date.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Money</h1>
        <RefreshControl />
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-wide text-faint">Tracked balance</p>
      <p className="tnum text-4xl">{usd(total)}</p>
      <p className="mt-1 text-xs text-muted">
        Across {alloc.length} account{alloc.length === 1 ? "" : "s"} · {usd(spending)} spent
        this month
      </p>

      {/* Allocation bar */}
      {total > 0 ? (
        <div className="mt-5 flex h-3.5 overflow-hidden rounded-lg border border-line">
          {alloc.map((a, i) => (
            <span
              key={a.id}
              style={{ flexGrow: a.pct, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          ))}
        </div>
      ) : null}

      {/* Allocation legend */}
      <div className="mt-2">
        {alloc.map((a, i) => (
          <div key={a.id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0">
            <span
              className="h-2.5 w-2.5 flex-none rounded-[3px]"
              style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.name}</p>
              <p className="truncate text-xs text-faint">{a.institutionName}</p>
            </div>
            <div className="text-right">
              <p className="tnum text-sm">{usd(a.balance)}</p>
              <p className="text-[11px] text-faint">{Math.round(a.pct)}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <h2 className="mb-1 mt-7 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Recent activity
      </h2>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">No transactions in the last 30 days.</p>
      ) : (
        [...groups.entries()].map(([key, txns]) => (
          <div key={key} className="mt-3">
            <p className="mb-1 text-xs text-faint">{dayLabel(new Date(key))}</p>
            {txns.map((t) => {
              const outflow = t.amount > 0; // Plaid: positive = money out
              return (
                <div key={t.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.merchantName ?? t.name}</p>
                    <p className="truncate text-xs text-faint">
                      {t.account.name}
                      {t.isTransfer ? " · transfer" : ""}
                      {t.pending ? " · pending" : ""}
                    </p>
                  </div>
                  <p className={`tnum text-sm ${outflow ? "text-ink" : "text-green"}`}>
                    {outflow ? "-" : "+"}
                    {usd2(Math.abs(t.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        ))
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-faint">
        Balances are synced from your linked accounts. Playbook never holds your money.
      </p>
    </>
  );
}
