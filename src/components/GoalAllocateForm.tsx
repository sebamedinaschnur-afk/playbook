"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addAdhocAllocation, type AllocationState } from "@/app/actions/allocations";

// Ad-hoc "add to goal" control on a goal card (addendum §3.2 MANUAL_ADHOC).
export function GoalAllocateForm({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AllocationState, FormData>(
    addAdhocAllocation,
    undefined,
  );

  useEffect(() => {
    if (!state?.ok) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- collapse after a successful add
    setOpen(false);
    router.refresh();
  }, [state, router]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-xs text-green">
        + Add to this goal
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 flex items-center gap-2">
      <input type="hidden" name="goalId" value={goalId} />
      <div className="flex flex-1 items-center rounded-lg border border-line bg-bg px-3 py-2">
        <span className="text-sm text-muted">$</span>
        <input
          name="amount"
          inputMode="decimal"
          autoFocus
          placeholder="0"
          className="tnum w-full bg-transparent pl-1 text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green px-3.5 py-2 text-sm font-semibold text-[#08251a] disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-faint">
        Cancel
      </button>
    </form>
  );
}
