"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mergeMatch, keepSeparate } from "@/app/actions/reconciliation";
import type { ReconcileMatch } from "@/lib/reconciliationService";

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const METHOD_LABEL: Record<string, string> = {
  CASH: "cash",
  APP: "app",
  COLLECTIVE: "collective",
  CHECK: "check",
};

// "Possible duplicate" banner + Resolve sheet (§4.4/§4.5). Never auto-merges.
export function ReconcileBanner({ match }: { match: ReconcileMatch }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [txnId, setTxnId] = useState(match.txn.id);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const options = [
    { id: match.txn.id, label: match.txn.label, amount: match.txn.amount, date: match.txn.date },
    ...match.alternatives,
  ];
  const selected = options.find((o) => o.id === txnId) ?? options[0];

  function close() {
    setOpen(false);
    setError(null);
  }
  function doMerge() {
    startTransition(async () => {
      const res = await mergeMatch(match.payment.id, txnId);
      if (!res.ok) {
        setError(res.error ?? "Couldn't merge.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }
  function doKeepSeparate() {
    startTransition(async () => {
      await keepSeparate(match.payment.id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block w-full rounded-2xl border border-brass/40 bg-brass-bg p-4 text-left active:scale-[.99]"
      >
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-brass">
          ⇄ Possible duplicate
        </p>
        <p className="mt-1.5 text-sm font-medium">
          A {usd(match.txn.amount)} bank deposit matches a payment you logged
        </p>
        <p className="mt-1 text-sm text-muted">
          Same amount cleared through your linked account. Merge them so it&apos;s not counted
          twice.
        </p>
        <span className="mt-2 inline-block text-sm font-semibold text-brass">Review match →</span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={close} aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-panel">
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="px-6 pb-8 pt-2">
              <h1 className="font-display text-2xl font-semibold">Same money?</h1>
              <p className="mt-2 text-sm text-muted">
                A deposit landed in your linked bank that looks like a payment you logged by hand.
                Merge them so your plan doesn&apos;t count it twice.
              </p>

              {/* comparison pair */}
              <div className="mt-5">
                <div className="rounded-t-2xl border border-b-0 border-line bg-panel2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brass">
                    ✎ Added by you
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <b className="text-base">{match.payment.payer ?? "Logged payment"}</b>
                    <span className="tnum text-base font-semibold text-green">
                      +{usd(match.payment.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {fmtDate(match.payment.occurredOn)} · {METHOD_LABEL[match.payment.method] ?? ""} ·{" "}
                    {match.payment.kind === "NIL_DEAL" ? "NIL deal" : "other income"}
                  </p>
                </div>
                <div className="flex h-7 items-center justify-center border-x border-line bg-panel">
                  <span className="rounded-full border border-line bg-panel px-2 text-sm font-bold text-brass">
                    =
                  </span>
                </div>
                <div className="rounded-b-2xl border border-t-0 border-line bg-panel2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-green">
                    🏦 From your bank
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <b className="text-base">{selected.label}</b>
                    <span className="tnum text-base font-semibold text-green">
                      +{usd(selected.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {fmtDate(selected.date)} · ACH deposit
                    {match.txn.mask ? ` · ${match.txn.accountName} ••${match.txn.mask}` : ""}
                  </p>
                </div>
              </div>

              {/* pick a different bank line */}
              {match.alternatives.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-muted">Not this one? Pick the right deposit:</p>
                  <div className="space-y-1.5">
                    {options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setTxnId(o.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                          txnId === o.id ? "border-green bg-green-tint" : "border-line bg-panel2"
                        }`}
                      >
                        <span className="truncate">
                          {o.label} · {fmtDate(o.date)}
                        </span>
                        <span className="tnum">{usd(o.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="mt-4 text-xs leading-relaxed text-faint">
                Merging keeps your tags (payer, NIL category) and your set-aside and goal, and
                uses the bank&apos;s confirmed date and amount.
              </p>

              {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={doKeepSeparate}
                  disabled={pending}
                  className="flex-1 rounded-xl border border-line bg-panel2 py-3 text-center font-display text-sm font-semibold text-ink disabled:opacity-50"
                >
                  Keep separate
                </button>
                <button
                  type="button"
                  onClick={doMerge}
                  disabled={pending}
                  className="flex-1 rounded-xl bg-green py-3 text-center font-display text-sm font-semibold text-[#08251a] disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Merge — same money"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
