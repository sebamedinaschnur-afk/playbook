"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addReserveMark,
  removeReserveMark,
  type ReserveMarkState,
} from "@/app/actions/reserve";

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

type Mark = { id: string; amount: number; markedAt: Date };

// Tax reserve view (addendum §4.6): target vs marked, the math, and a self-report
// "I moved this" action. Playbook moves no money — this only records intent.
export function ReserveTracker({
  target,
  marked,
  remaining,
  pct,
  ratePct,
  marks,
}: {
  target: number;
  marked: number;
  remaining: number;
  pct: number;
  ratePct: number;
  marks: Mark[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ReserveMarkState, FormData>(
    addReserveMark,
    undefined,
  );
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : "");

  useEffect(() => {
    if (!state?.ok) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear input after a successful mark
    setAmount("");
    router.refresh();
  }, [state, router]);

  return (
    <div className="mt-3 rounded-2xl border border-brass/40 bg-brass-bg p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-brass">Tax reserve</p>
        <p className="text-xs text-muted">{Math.round(pct)}%</p>
      </div>
      <p className="tnum mt-1 text-2xl">
        {usd(marked)} <span className="text-base text-muted">set aside of {usd(target)}</span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
        <span className="block h-full rounded-full bg-brass" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Target is {Math.round(ratePct)}% of your logged NIL income.
        {remaining > 0 ? ` ${usd(remaining)} left to move.` : " You're fully reserved."}
      </p>

      {/* I moved this $X */}
      <form action={action} className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-line bg-bg px-3 py-2">
          <span className="text-sm text-muted">$</span>
          <input
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="tnum w-full bg-transparent pl-1 text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brass px-3.5 py-2 text-sm font-semibold text-[#231a05] disabled:opacity-50"
        >
          {pending ? "Saving…" : "I moved this"}
        </button>
      </form>
      {state?.error ? <p className="mt-1.5 text-xs text-red">{state.error}</p> : null}

      {/* Marks history */}
      {marks.length > 0 ? (
        <div className="mt-3 border-t border-brass/20 pt-2">
          {marks.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-1.5">
              <p className="text-xs text-muted">
                Moved {usd(m.amount)} ·{" "}
                {new Date(m.markedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <form action={removeReserveMark}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className="text-xs text-faint">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Playbook never moves money — tapping this just records that you set it aside yourself.
      </p>
    </div>
  );
}
