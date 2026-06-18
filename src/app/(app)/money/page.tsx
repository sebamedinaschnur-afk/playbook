import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { RefreshControl } from "@/components/RefreshControl";
import { InputPaymentLauncher } from "@/components/InputPaymentLauncher";
import { ReserveTracker } from "@/components/ReserveTracker";
import { ReconcileBanner } from "@/components/ReconcileBanner";
import { InflowTagControl } from "@/components/InflowTagControl";
import { getReserveData } from "@/lib/reserveService";
import { getGoalsWithSaved } from "@/lib/goalsService";
import { findBestMatch } from "@/lib/reconciliationService";
import { undoMerge, undoKeepSeparate } from "@/app/actions/reconciliation";
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

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash payment",
  APP: "App payment",
  COLLECTIVE: "Collective payment",
  CHECK: "Check payment",
};
const KIND_LABEL: Record<string, string> = {
  NIL_DEAL: "NIL deal",
  OTHER_INCOME: "Other income",
};

type Item = {
  id: string;
  date: Date;
  title: string;
  sub: string;
  amount: number; // display magnitude
  inflow: boolean; // true → green +
  manual: boolean;
  badge?: "added" | "kept" | "merged";
  undoPaymentId?: string; // for merged/kept rows
  taggable?: boolean; // untagged Plaid inflow → show tag control
  tagged?: "NIL_INCOME" | "NOT_INCOME";
};

// Money view (spec §2.3 + input-payment addendum). Manual entry is a first-class
// path: the "Log a payment" card and manual activity show even with no linked bank.
export default async function MoneyPage() {
  const user = await getCurrentUser();
  // eslint-disable-next-line react-hooks/purity -- per-request window in an async Server Component
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [accounts, recent, manualPayments, reserve, goals, match] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: since } },
      orderBy: { date: "desc" },
      include: {
        account: { select: { name: true, mask: true } },
        reconciledManualPayment: { select: { id: true, payer: true } }, // set when merged
      },
    }),
    prisma.manualPayment.findMany({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "KEPT_SEPARATE"] }, // MERGED shows as its bank txn
        occurredOn: { gte: since },
      },
      orderBy: { occurredOn: "desc" },
    }),
    getReserveData(user.id),
    getGoalsWithSaved(user.id),
    findBestMatch(user.id),
  ]);

  const hasAccounts = accounts.length > 0;
  const total = totalTrackedBalance(accounts);
  const alloc = allocation(accounts);
  const spending = monthlySpending(
    recent.map((t) => ({
      amount: t.amount,
      date: t.date,
      isTransfer: t.isTransfer,
      isSelfTransfer: t.isSelfTransfer,
    })),
  );

  // Unified activity: Plaid transactions + manual payments, newest first.
  const items: Item[] = [
    ...recent.map((t): Item => {
      const merged = t.reconciledManualPayment;
      const inflow = t.amount < 0; // Plaid: negative = money in
      const isXfer = t.isTransfer || t.isSelfTransfer;
      return {
        id: t.id,
        date: t.date,
        // A merged bank line is the source of truth — show the user's payer tag.
        title: merged ? (merged.payer ?? t.merchantName ?? t.name) : (t.merchantName ?? t.name),
        sub: [t.account.name, isXfer ? "transfer" : null, t.pending ? "pending" : null]
          .filter(Boolean)
          .join(" · "),
        amount: Math.abs(t.amount),
        inflow,
        manual: false,
        badge: merged ? "merged" : undefined,
        undoPaymentId: merged?.id,
        taggable: inflow && !merged && !isXfer && t.incomeTag === "UNTAGGED",
        tagged: t.incomeTag === "NIL_INCOME" ? "NIL_INCOME" : t.incomeTag === "NOT_INCOME" ? "NOT_INCOME" : undefined,
      };
    }),
    ...manualPayments.map((p): Item => ({
      id: p.id,
      date: p.occurredOn,
      title: p.payer ?? METHOD_LABEL[p.method] ?? "Payment",
      sub: `${KIND_LABEL[p.kind] ?? ""} · ${METHOD_LABEL[p.method] ?? ""}`,
      amount: p.amount,
      inflow: true,
      manual: true,
      badge: p.status === "KEPT_SEPARATE" ? "kept" : "added",
      undoPaymentId: p.status === "KEPT_SEPARATE" ? p.id : undefined,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const groups = new Map<string, Item[]>();
  for (const it of items) {
    const key = it.date.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Money</h1>
        {hasAccounts ? <RefreshControl /> : null}
      </div>

      {/* Reconciliation banner (addendum §4.4) — user-confirmed, never auto-merges */}
      {match ? <ReconcileBanner match={match} /> : null}

      {hasAccounts ? (
        <>
          <p className="mt-4 text-[11px] uppercase tracking-wide text-faint">Tracked balance</p>
          <p className="tnum text-4xl">{usd(total)}</p>
          <p className="mt-1 text-xs text-muted">
            Across {alloc.length} account{alloc.length === 1 ? "" : "s"} · {usd(spending)} spent
            this month
          </p>

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
        </>
      ) : null}

      {/* Log a payment (always available — manual entry is first-class, spec §2.8) */}
      <div className="mt-5">
        <InputPaymentLauncher variant="card" goals={goals} />
      </div>

      {/* Tax reserve tracker (addendum §4.6) — shown once there's income to reserve */}
      {reserve.target > 0 ? <ReserveTracker {...reserve} /> : null}

      {!hasAccounts ? (
        <div className="mt-3 rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-muted">
            Want balances and spending tracked automatically too? Link a bank.
          </p>
          <PlaidLinkButton className="mt-3 rounded-lg border border-green-border px-3.5 py-2 text-sm font-semibold text-green disabled:opacity-50">
            Connect a bank
          </PlaidLinkButton>
        </div>
      ) : null}

      {/* Activity */}
      <h2 className="mb-1 mt-7 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing yet. Log a payment above, or link a bank to sync transactions.
        </p>
      ) : (
        [...groups.entries()].map(([key, group]) => (
          <div key={key} className="mt-3">
            <p className="mb-1 text-xs text-faint">{dayLabel(new Date(key))}</p>
            {group.map((it) => (
              <div key={it.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{it.title}</p>
                  <p className="truncate text-xs text-faint">{it.sub}</p>
                  {it.badge ? (
                    <span className="mt-1 inline-flex items-center gap-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          it.badge === "merged"
                            ? "bg-green-tint text-green"
                            : "bg-brass-bg text-brass"
                        }`}
                      >
                        {it.badge === "merged"
                          ? "Merged ✓"
                          : it.badge === "kept"
                            ? "Added by you · kept"
                            : "Added by you"}
                      </span>
                      {it.badge === "merged" && it.undoPaymentId ? (
                        <form action={undoMerge}>
                          <input type="hidden" name="paymentId" value={it.undoPaymentId} />
                          <button type="submit" className="text-[11px] text-faint underline">
                            Undo
                          </button>
                        </form>
                      ) : null}
                      {it.badge === "kept" && it.undoPaymentId ? (
                        <form action={undoKeepSeparate}>
                          <input type="hidden" name="paymentId" value={it.undoPaymentId} />
                          <button type="submit" className="text-[11px] text-faint underline">
                            Undo
                          </button>
                        </form>
                      ) : null}
                    </span>
                  ) : null}
                  {it.taggable ? <InflowTagControl txnId={it.id} /> : null}
                  {it.tagged === "NIL_INCOME" ? (
                    <span className="mt-1 inline-block rounded bg-green-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green">
                      NIL income
                    </span>
                  ) : null}
                  {it.tagged === "NOT_INCOME" ? (
                    <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-faint">
                      Not income
                    </span>
                  ) : null}
                </div>
                <p className={`tnum text-sm ${it.inflow ? "text-green" : "text-ink"}`}>
                  {it.inflow ? "+" : "-"}
                  {usd2(it.amount)}
                </p>
              </div>
            ))}
          </div>
        ))
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-faint">
        Balances are synced from your linked accounts. Playbook never holds or moves your money.
      </p>
    </>
  );
}
