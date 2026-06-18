"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { logManualPayment, type LogPaymentState } from "@/app/actions/payments";
import { assignGoalAllocation } from "@/app/actions/allocations";
import { Pill, PillRow } from "@/components/onboarding-ui";

export type LauncherGoal = {
  id: string;
  title: string;
  emoji: string;
  targetAmount: number;
  saved: number;
};

const KINDS = [
  { value: "NIL_DEAL", emoji: "🏷️", label: "NIL deal" },
  { value: "OTHER_INCOME", emoji: "💸", label: "Other income" },
] as const;

const METHODS = [
  { value: "CASH", emoji: "💵", label: "Cash" },
  { value: "APP", emoji: "📲", label: "Venmo / app" },
  { value: "COLLECTIVE", emoji: "🏟️", label: "Collective" },
  { value: "CHECK", emoji: "🧾", label: "Check" },
] as const;

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Trigger + bottom sheet. Used on Money (card) and Home (FAB) — same sheet.
export function InputPaymentLauncher({
  variant,
  goals = [],
}: {
  variant: "card" | "fab";
  goals?: LauncherGoal[];
}) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0); // remount the flow on each open → fresh form
  const router = useRouter();

  function openSheet() {
    setInstance((n) => n + 1);
    setOpen(true);
  }
  function closeSheet() {
    setOpen(false);
    router.refresh(); // reflect any newly-logged payment in the server-rendered list
  }

  return (
    <>
      {variant === "card" ? (
        <div className="rounded-2xl border border-green-border bg-green-tint p-4">
          <p className="text-sm font-medium text-green">Log a payment</p>
          <p className="mt-1 text-sm text-muted">
            Got paid in cash, Venmo, or through a collective? Anything that doesn&apos;t hit a
            linked bank — add it here so your plan stays accurate.
          </p>
          <button
            type="button"
            onClick={openSheet}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green px-3.5 py-2 text-sm font-semibold text-[#08251a]"
          >
            <span className="text-base leading-none">+</span> Input a payment
          </button>
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-md justify-end px-5">
          <button
            type="button"
            onClick={openSheet}
            aria-label="Log a payment"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-green text-2xl font-bold text-[#08251a] shadow-lg shadow-green/30 active:scale-95"
          >
            +
          </button>
        </div>
      )}

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={closeSheet}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-panel">
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line" />
            <PaymentFlow key={instance} goals={goals} onDone={closeSheet} />
          </div>
        </>
      ) : null}
    </>
  );
}

function PaymentFlow({
  goals,
  onDone,
}: {
  goals: LauncherGoal[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<LogPaymentState, FormData>(
    logManualPayment,
    undefined,
  );
  const [kind, setKind] = useState<string>("NIL_DEAL");
  const [method, setMethod] = useState<string>("CASH");

  // Step B allocation state
  const [assignAmt, setAssignAmt] = useState("");
  const [goalId, setGoalId] = useState<string>(""); // "" = don't assign yet
  const [saving, setSaving] = useState(false);
  const [allocErr, setAllocErr] = useState<string | null>(null);

  // Step B — confirmation
  if (state?.ok) {
    const amount = state.amount ?? 0;
    const setAside = state.setAside ?? 0;
    const leftover = Math.max(0, Math.round((amount - setAside) * 100) / 100);
    const paymentId = state.paymentId ?? "";

    async function handleDone() {
      const amt = Number(assignAmt);
      if (goalId && amt > 0) {
        setSaving(true);
        setAllocErr(null);
        const res = await assignGoalAllocation(paymentId, goalId, amt);
        setSaving(false);
        if (res && !res.ok) {
          setAllocErr(res.error ?? "Couldn't assign to the goal.");
          return;
        }
      }
      onDone();
    }

    return (
      <div className="px-6 pb-8 pt-2">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-tint">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3DBE8B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold">
            Logged <span className="text-green">{usd(amount)}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Added to your money. Here&apos;s what your plan suggests next.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-brass/40 bg-brass-bg p-4">
          <p className="text-[11px] uppercase tracking-wide text-brass">Tax set-aside</p>
          <h3 className="mt-1 font-display text-xl font-semibold">Set aside {usd(setAside)}</h3>
          <p className="mt-1.5 text-sm text-muted">
            NIL income is paid untaxed — setting this aside keeps April from surprising you.
            Moving it is always your call.
          </p>
        </div>

        {/* Goal allocation (addendum §4.3) */}
        {goals.length > 0 ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Put money toward a goal?</p>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-line bg-bg px-3 py-2">
                <span className="text-sm text-muted">$</span>
                <input
                  inputMode="decimal"
                  value={assignAmt}
                  onChange={(e) => setAssignAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  className="tnum w-full bg-transparent pl-1 text-sm text-ink outline-none placeholder:text-faint"
                />
              </div>
              <button
                type="button"
                onClick={() => setAssignAmt(String(leftover))}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-green"
              >
                Leftover {usd(leftover)}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoalId(g.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    goalId === g.id ? "border-green bg-green-tint" : "border-line bg-panel2"
                  }`}
                >
                  <span className="text-lg">{g.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <p className="truncate text-xs text-faint">
                      {usd(g.saved)} of {usd(g.targetAmount)}
                    </p>
                  </div>
                  <span
                    className={`h-4 w-4 flex-none rounded-full border-2 ${
                      goalId === g.id ? "border-green bg-green" : "border-faint"
                    }`}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGoalId("")}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                  goalId === "" ? "border-green bg-green-tint" : "border-line bg-panel2"
                }`}
              >
                <span className="text-lg">➖</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Don&apos;t assign yet</p>
                  <p className="truncate text-xs text-faint">Keep it liquid and tracked</p>
                </div>
                <span
                  className={`h-4 w-4 flex-none rounded-full border-2 ${
                    goalId === "" ? "border-green bg-green" : "border-faint"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : null}

        {allocErr ? <p className="mt-3 text-center text-xs text-red">{allocErr}</p> : null}

        <p className="mt-5 text-center text-[11px] leading-relaxed text-faint">
          Playbook never moves money. These are suggestions you act on in your own bank.
        </p>

        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-green py-3 text-center font-display text-sm font-semibold text-[#08251a] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </div>
    );
  }

  // Step A — entry form
  return (
    <form action={action} className="px-6 pb-8 pt-2">
      <h1 className="font-display text-2xl font-semibold">Input a payment</h1>
      <p className="mt-2 text-sm text-muted">
        For money that doesn&apos;t show up automatically. Playbook logs it — it never
        touches your accounts.
      </p>

      <div className="my-7 flex items-center justify-center gap-1">
        <span className="text-3xl font-semibold text-muted">$</span>
        <input
          name="amount"
          inputMode="decimal"
          autoFocus
          placeholder="0"
          className="w-44 bg-transparent text-center font-display text-5xl font-bold text-ink outline-none placeholder:text-line"
        />
      </div>
      {state?.errors?.amount ? (
        <p className="-mt-4 mb-2 text-center text-xs text-red">{state.errors.amount[0]}</p>
      ) : null}

      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="method" value={method} />

      <p className="mb-2 text-xs text-muted">What kind of payment?</p>
      <PillRow>
        {KINDS.map((k) => (
          <Pill key={k.value} selected={kind === k.value} onClick={() => setKind(k.value)}>
            <span className="mr-1">{k.emoji}</span>
            {k.label}
          </Pill>
        ))}
      </PillRow>

      <p className="mb-2 mt-5 text-xs text-muted">How were you paid?</p>
      <PillRow>
        {METHODS.map((m) => (
          <Pill key={m.value} selected={method === m.value} onClick={() => setMethod(m.value)}>
            <span className="mr-1">{m.emoji}</span>
            {m.label}
          </Pill>
        ))}
      </PillRow>

      <p className="mb-2 mt-5 text-xs text-muted">
        Who paid you? <span className="text-faint">(optional)</span>
      </p>
      <input
        name="payer"
        type="text"
        placeholder="e.g. Local dealership, booster collective"
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-sm text-ink outline-none focus:border-green placeholder:text-faint"
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-7 w-full rounded-xl bg-green py-3 text-center font-display text-sm font-semibold text-[#08251a] disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log payment"}
      </button>
    </form>
  );
}
